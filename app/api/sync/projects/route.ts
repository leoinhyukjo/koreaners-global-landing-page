import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { parseSheetRow } from '@/lib/sheets/parsers'
import { getJpyToKrwRate } from '@/lib/exchange-rate'
import { authenticateSync } from '@/lib/sync-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

// ─── Types ────────────────────────────────────────────────────

interface SyncResult {
  synced: number
  errors: string[]
  exchangeRate: number
}

// ─── Google Auth ───────────────────────────────────────────────

function getGoogleAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
  const credentialsJson = raw.startsWith('{') ? raw : readFileSync(raw, 'utf8')
  const credentials = JSON.parse(credentialsJson)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

// ─── POST Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse body
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // Body might be empty (auth via header only) — that's fine
  }

  // Authenticate
  const auth = authenticateSync(
    request,
    typeof body?.secret === 'string' ? body.secret : undefined,
  )
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate environment
  if (!process.env.GOOGLE_SHEETS_PROJECT_ID) {
    return NextResponse.json(
      { error: 'GOOGLE_SHEETS_PROJECT_ID is not configured' },
      { status: 500 },
    )
  }

  const result: SyncResult = { synced: 0, errors: [], exchangeRate: 0 }

  try {
    console.log('[sync/projects] Starting project sync from Google Sheets...')

    // 1. 환율 조회
    const exchangeRate = await getJpyToKrwRate()
    result.exchangeRate = exchangeRate
    console.log(`[sync/projects] JPY→KRW rate: ${exchangeRate}`)

    // 2. Google Sheets 데이터 조회
    const googleAuth = getGoogleAuth()
    const sheets = google.sheets({ version: 'v4', auth: googleAuth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_PROJECT_ID,
      range: '시트1!A:AI',
      valueRenderOption: 'FORMATTED_VALUE',
    })

    const values = response.data.values ?? []
    // Skip header row
    const rows = values.slice(1)
    console.log(`[sync/projects] Fetched ${rows.length} rows from Google Sheets`)

    // 3. Supabase admin client
    const supabase = createAdminClient()

    // 4. 레코드 변환 (row_code 중복 시 마지막 행 우선)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const recordMap = new Map<string, any>()
    for (const row of rows) {
      try {
        const parsed = parseSheetRow(row)
        if (parsed == null) continue
        recordMap.set(parsed.row_code as string, parsed)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        result.errors.push(`Row parse error: ${message}`)
      }
    }
    const records = [...recordMap.values()]
    /* eslint-enable @typescript-eslint/no-explicit-any */

    console.log(`[sync/projects] Parsed ${records.length} unique records`)

    // 5. 배치 upsert (50건 단위)
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

    console.log(
      `[sync/projects] Sync complete. Synced: ${result.synced}, Errors: ${result.errors.length}, Rate: ${result.exchangeRate}`,
    )

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync/projects] Fatal error:', message)
    return NextResponse.json(
      {
        synced: result.synced,
        errors: [...result.errors, `Fatal: ${message}`],
        exchangeRate: result.exchangeRate,
      },
      { status: 500 },
    )
  }
}
