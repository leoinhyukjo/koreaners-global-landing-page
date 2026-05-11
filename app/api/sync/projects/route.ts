import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { buildIndexMap, parseRowDynamic } from '@/lib/sheets/column-map'
import { getExchangeRates } from '@/lib/exchange-rate'
import { authenticateSync } from '@/lib/sync-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

interface SyncResult {
  synced: number
  errors: string[]
  exchangeRates: { jpyToKrw: number; usdToKrw: number }
  duplicates?: number
}

function getGoogleAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
  const credentialsJson = raw.startsWith('{') ? raw : readFileSync(raw, 'utf8')
  const credentials = JSON.parse(credentialsJson)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

// "Dashboard" 포함 탭 중 이름 내 최대 숫자 기준 (예: "26년 Dashboard" > "25년 Dashboard") 우선.
// 시트 연도 교체로 탭명이 바뀌어도 자동 탐지.
async function resolveDashboardTabName(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<string> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' })
  const titles = (meta.data.sheets ?? [])
    .map(s => s.properties?.title ?? '')
    .filter(t => /dashboard/i.test(t))
  if (titles.length === 0) {
    throw new Error('No "Dashboard" tab found in spreadsheet')
  }
  titles.sort((a, b) => {
    const numA = Math.max(...(a.match(/\d+/g)?.map(Number) ?? [0]))
    const numB = Math.max(...(b.match(/\d+/g)?.map(Number) ?? [0]))
    return numB - numA
  })
  return titles[0]
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // Body might be empty — that's fine
  }

  const auth = authenticateSync(
    request,
    typeof body?.secret === 'string' ? body.secret : undefined,
  )
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GOOGLE_SHEETS_PROJECT_ID) {
    return NextResponse.json(
      { error: 'GOOGLE_SHEETS_PROJECT_ID is not configured' },
      { status: 500 },
    )
  }

  const result: SyncResult = { synced: 0, errors: [], exchangeRates: { jpyToKrw: 0, usdToKrw: 0 } }

  try {
    console.log('[sync/projects] Starting project sync from Google Sheets (Dashboard tab)...')

    // 1. 환율 조회 (JPY + USD)
    const rates = await getExchangeRates()
    result.exchangeRates = rates
    console.log(`[sync/projects] Rates: JPY→KRW ${rates.jpyToKrw}, USD→KRW ${rates.usdToKrw}`)

    // 2. Google Sheets 데이터 조회 (Dashboard 탭 — 연도 prefix 자동 탐지)
    const googleAuth = getGoogleAuth()
    const sheets = google.sheets({ version: 'v4', auth: googleAuth })

    const tabName = await resolveDashboardTabName(sheets, process.env.GOOGLE_SHEETS_PROJECT_ID)
    console.log(`[sync/projects] Resolved dashboard tab: "${tabName}"`)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_PROJECT_ID,
      range: `'${tabName}'!A:AZ`,
      valueRenderOption: 'FORMATTED_VALUE',
    })

    const values = response.data.values ?? []
    if (values.length < 2) {
      return NextResponse.json({ ...result, errors: ['No data rows in sheet'] }, { status: 200 })
    }

    // 3. 헤더 기반 인덱스 맵 빌드
    const indexMap = buildIndexMap(values[0])
    const rows = values.slice(1)
    console.log(`[sync/projects] Fetched ${rows.length} rows, ${indexMap.size} mapped columns`)

    // 4. Supabase admin client
    const supabase = createAdminClient()

    // 5. 레코드 변환 (행 번호 기반 row_code, 빈 행 스킵)
    const records: Record<string, unknown>[] = []
    for (let i = 0; i < rows.length; i++) {
      try {
        const parsed = parseRowDynamic(rows[i], indexMap, i + 2) // 행 번호: 헤더=1, 데이터=2~
        if (parsed == null) continue
        records.push(parsed)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        result.errors.push(`Row ${i + 2} parse error: ${message}`)
      }
    }
    console.log(`[sync/projects] Parsed ${records.length} records`)

    // 5b. row_code 중복 제거 (last wins — 시트 뒤쪽 row 가 더 최신이라는 가정).
    // 시트에 같은 유니크코드가 두 번 들어가면 batch upsert 가 "command cannot affect
    // row a second time" 로 전체 실패하므로, 서버 측에서 먼저 정리.
    const deduped: Record<string, unknown>[] = []
    const seen = new Map<string, number>() // row_code -> deduped index
    for (const rec of records) {
      const code = String(rec.row_code ?? '')
      const existing = seen.get(code)
      if (existing !== undefined) {
        deduped[existing] = rec
      } else {
        seen.set(code, deduped.length)
        deduped.push(rec)
      }
    }
    result.duplicates = records.length - deduped.length
    if (result.duplicates > 0) {
      console.log(`[sync/projects] Collapsed ${result.duplicates} duplicate row_code(s) before upsert`)
    }

    // 6. Upsert (신규 + 기존 덮어쓰기). 배치 실패 시 한 배치만 영향.
    // synced_at 명시 주입 → 컬럼값 변동이 없어도 매 sync 마다 갱신되어 "마지막 동기화" 표시가 움직임.
    const syncedAt = new Date().toISOString()
    for (const rec of deduped) {
      rec.synced_at = syncedAt
    }
    const BATCH_SIZE = 50
    for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
      const batch = deduped.slice(i, i + BATCH_SIZE)
      const { error: upsertError } = await supabase
        .from('projects')
        .upsert(batch, { onConflict: 'row_code' })

      if (upsertError) {
        result.errors.push(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${upsertError.message}`,
        )
      } else {
        result.synced += batch.length
      }
    }

    // 7. 시트에 없는 row_code 는 삭제 (mirror full-replace 의미 유지)
    const activeCodes = new Set(deduped.map(r => String(r.row_code ?? '')))
    const { data: existing, error: listError } = await supabase
      .from('projects')
      .select('row_code')
    if (listError) {
      result.errors.push(`List existing: ${listError.message}`)
    } else if (existing) {
      const stale = existing
        .map(r => r.row_code as string)
        .filter(code => code && !activeCodes.has(code))
      if (stale.length > 0) {
        const { error: delError } = await supabase
          .from('projects')
          .delete()
          .in('row_code', stale)
        if (delError) {
          result.errors.push(`Delete stale: ${delError.message}`)
        } else {
          console.log(`[sync/projects] Deleted ${stale.length} stale row(s)`)
        }
      }
    }

    console.log(
      `[sync/projects] Sync complete. Synced: ${result.synced}, Duplicates collapsed: ${result.duplicates ?? 0}, Errors: ${result.errors.length}`,
    )

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync/projects] Fatal error:', message)
    return NextResponse.json(
      { synced: result.synced, errors: [...result.errors, `Fatal: ${message}`], exchangeRates: result.exchangeRates },
      { status: 500 },
    )
  }
}
