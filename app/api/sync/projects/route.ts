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

    // 2. Google Sheets 데이터 조회 (Dashboard 탭)
    const googleAuth = getGoogleAuth()
    const sheets = google.sheets({ version: 'v4', auth: googleAuth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_PROJECT_ID,
      range: 'Dashboard!A:AL',
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

    // 6. Full replace: 기존 데이터 전체 삭제 → 새 데이터 삽입
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .neq('row_code', '__never_match__') // 전체 삭제 workaround

    if (deleteError) {
      result.errors.push(`Delete all: ${deleteError.message}`)
    }

    // 7. 배치 insert (50건 단위)
    const BATCH_SIZE = 50
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase
        .from('projects')
        .insert(batch)

      if (insertError) {
        result.errors.push(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`,
        )
      } else {
        result.synced += batch.length
      }
    }

    console.log(
      `[sync/projects] Sync complete. Synced: ${result.synced}, Errors: ${result.errors.length}`,
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
