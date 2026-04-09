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
      range: 'Dashboard!A:AJ',
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

    // 5. 레코드 변환 (row_code 중복 시 마지막 행 우선)
    const recordMap = new Map<string, Record<string, unknown>>()
    for (const row of rows) {
      try {
        const parsed = parseRowDynamic(row, indexMap)
        if (parsed == null) continue
        recordMap.set(parsed.row_code as string, parsed)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        result.errors.push(`Row parse error: ${message}`)
      }
    }
    const records = [...recordMap.values()]
    console.log(`[sync/projects] Parsed ${records.length} unique records`)

    // 6. 배치 upsert (50건 단위)
    const BATCH_SIZE = 50
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
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

    // 7. 시트에 없는 레코드 삭제
    const sheetRowCodes = [...recordMap.keys()]
    const { error: deleteError, count: deleteCount } = await supabase
      .from('projects')
      .delete({ count: 'exact' })
      .not('row_code', 'in', `(${sheetRowCodes.map((c) => `"${c}"`).join(',')})`)

    if (deleteError) {
      result.errors.push(`Delete stale rows: ${deleteError.message}`)
    } else if (deleteCount && deleteCount > 0) {
      console.log(`[sync/projects] Deleted ${deleteCount} stale rows not in Dashboard tab`)
    }

    console.log(
      `[sync/projects] Sync complete. Synced: ${result.synced}, Deleted: ${deleteCount ?? 0}, Errors: ${result.errors.length}`,
    )

    return NextResponse.json({ ...result, deleted: deleteCount ?? 0 }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync/projects] Fatal error:', message)
    return NextResponse.json(
      { synced: result.synced, errors: [...result.errors, `Fatal: ${message}`], exchangeRates: result.exchangeRates },
      { status: 500 },
    )
  }
}
