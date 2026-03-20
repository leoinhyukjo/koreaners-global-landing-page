#!/usr/bin/env node

/**
 * Standalone project sync: Google Sheets → Supabase
 * launchd에서 직접 실행 (Vercel 타임아웃 우회)
 *
 * Usage: node scripts/sync-projects.mjs
 * Env: .env.local 에서 자동 로드
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import dns from 'dns/promises'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

// ─── Config ───────────────────────────────────────────────────

const REQUIRED_ENV = [
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SHEETS_PROJECT_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[sync-projects] Missing env var: ${key}`)
    process.exit(1)
  }
}

const credentials = JSON.parse(
  readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'utf8'),
)
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})
const sheets = google.sheets({ version: 'v4', auth })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const FALLBACK_JPY_TO_KRW = 9.0
const RETRY_MAX = 3
const RETRY_DELAY_MS = 2000

// ─── Sheet row parsers ──────────────────────────────────────

function parseMoney(raw) {
  if (!raw) return 0
  const cleaned = raw.replace(/[₩¥\\,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseDate(raw) {
  if (!raw || !raw.trim()) return null
  const m = raw.match(/(\d{4})[.\s/]+(\d{1,2})[.\s/]+(\d{1,2})/)
  if (!m) return null
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
}

function parseEntryDate(raw) {
  if (!raw || !raw.trim()) return null
  const dateStr = raw.split(' ')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return parseDate(dateStr)
}

function parseAssignees(raw) {
  if (!raw || !raw.trim()) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseSheetRow(row) {
  const code = row[2]?.trim()
  if (!code) return null
  return {
    row_code: code,
    entry_date: parseEntryDate(row[0]),
    week_code: row[1]?.trim() || null,
    company_name: row[3]?.trim() || null,
    brand_name: row[4]?.trim() || null,
    name: row[4]?.trim() || row[3]?.trim() || code,
    status: row[5]?.trim() || null,
    project_type: row[6]?.trim() || null,
    media: row[7]?.trim() || null,
    assignee_names: parseAssignees(row[9]),
    assignee_sub: parseAssignees(row[10]),
    start_date: parseDate(row[11]),
    end_date: parseDate(row[12]),
    note: row[13]?.trim() || null,
    contract_krw: parseMoney(row[15]),
    contract_jpy: parseMoney(row[16]),
    collab_fee: parseMoney(row[17]),
    expense_krw: parseMoney(row[18]),
    expense_jpy: parseMoney(row[19]),
    margin_krw: parseMoney(row[20]),
    margin_jpy: parseMoney(row[21]),
    estimate_status: row[23]?.trim() || null,
    contract_status: row[24]?.trim() || null,
    contract_date: parseDate(row[25]),
    settlement_due_date: parseDate(row[26]),
    advance_paid_date: parseDate(row[27]),
    balance_paid_date: parseDate(row[28]),
    contract_cost: parseMoney(row[29]),
    tax_invoice_date: parseDate(row[30]),
    payment_status: row[31]?.trim() || null,
    remittance_status: row[32]?.trim() || null,
    creator_settlement_note: row[34]?.trim() || null,
  }
}

// ─── Slack DM notification (Oliver bot) ─────────────────────

async function notifySlack(scriptName, status, detail = '') {
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')
  let token = process.env.SLACK_BOT_TOKEN || ''
  let userId = process.env.SLACK_MY_USER_ID || ''
  if (!token || !userId) {
    try {
      const shared = fs.readFileSync(
        path.join(os.homedir(), '.config/shared-env/.env.shared'),
        'utf8',
      )
      for (const line of shared.split('\n')) {
        if (line.startsWith('SLACK_BOT_TOKEN='))
          token = line.split('=')[1].trim()
        if (line.startsWith('SLACK_MY_USER_ID='))
          userId = line.split('=')[1].trim()
      }
    } catch {}
  }
  if (!token || !userId) return
  const emoji = status === 'success' ? '✅' : '❌'
  const msg = `${emoji} *${scriptName}* — ${status}${detail ? `\n\`\`\`${detail.slice(0, 500)}\`\`\`` : ''}`
  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel: userId, text: msg }),
    })
  } catch {}
}

// ─── Network readiness ──────────────────────────────────────

async function waitForNetwork() {
  const deadline = new Date()
  deadline.setHours(23, 50, 0, 0)
  let attempt = 0
  const start = Date.now()
  while (Date.now() < deadline.getTime()) {
    try {
      await dns.lookup('dns.google')
      if (attempt > 0) {
        const elapsed = Math.floor((Date.now() - start) / 60000)
        console.log(`[NET] 네트워크 연결 확인 (${attempt}회 재시도, ${elapsed}분 대기)`)
      }
      return
    } catch {
      attempt++
      const delay = attempt <= 5 ? Math.min(30, Math.pow(2, attempt)) * 1000 : 600000
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  console.error('[FATAL] 당일 자정까지 네트워크 미연결 — 종료')
  process.exit(1)
}

// ─── Retry wrapper ───────────────────────────────────────────

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt === RETRY_MAX) {
        throw new Error(`${label} failed after ${RETRY_MAX} attempts: ${msg}`)
      }
      console.warn(
        `[sync-projects] ${label} attempt ${attempt} failed: ${msg}. Retrying in ${RETRY_DELAY_MS}ms...`,
      )
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Exchange rate ───────────────────────────────────────────

async function getJpyToKrwRate() {
  const today = new Date().toISOString().slice(0, 10)

  // 1. Supabase 당일 캐시
  try {
    const { data: cached } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('currency_pair', 'JPY/KRW')
      .eq('rate_date', today)
      .maybeSingle()
    if (cached?.rate != null) return cached.rate
  } catch {}

  // 2. ECOS API
  const apiKey = process.env.BOK_ECOS_API_KEY
  if (apiKey) {
    try {
      const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/1/731Y001/D/${today}/${today}/JPY/0000003`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        const rows = json?.StatisticSearch?.row
        if (Array.isArray(rows) && rows.length > 0) {
          const raw = parseFloat(rows[0].DATA_VALUE)
          if (!isNaN(raw)) {
            const rate = raw / 100
            // 캐시 저장
            await supabase.from('exchange_rates').upsert(
              {
                currency_pair: 'JPY/KRW',
                rate,
                rate_date: today,
                source: 'ecos',
                fetched_at: new Date().toISOString(),
              },
              { onConflict: 'currency_pair,rate_date' },
            )
            return rate
          }
        }
      }
    } catch {}
  }

  // 3. 최근 캐시
  try {
    const { data: recent } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('currency_pair', 'JPY/KRW')
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (recent?.rate != null) return recent.rate
  } catch {}

  return FALLBACK_JPY_TO_KRW
}

// ─── Fetch Google Sheets data ────────────────────────────────

async function fetchSheetRows() {
  const { data } = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_PROJECT_ID,
        range: '시트1!A:AI',
        valueRenderOption: 'FORMATTED_VALUE',
      }),
    'Google Sheets fetch',
  )
  return (data.values ?? []).slice(1) // skip header
}

// ─── Batch upsert to Supabase ────────────────────────────────

async function batchUpsert(records) {
  const BATCH_SIZE = 50
  let upserted = 0
  const errors = []

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    try {
      const { error } = await withRetry(
        () =>
          supabase
            .from('projects')
            .upsert(batch, { onConflict: 'row_code' }),
        `Supabase upsert batch ${Math.floor(i / BATCH_SIZE) + 1}`,
      )
      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      } else {
        upserted += batch.length
      }
    } catch (err) {
      errors.push(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return { upserted, errors }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  await waitForNetwork()
  const startTime = Date.now()
  console.log(`[sync-projects] Starting project sync at ${new Date().toISOString()}`)

  // 1. 환율
  const exchangeRate = await getJpyToKrwRate()
  console.log(`[sync-projects] JPY→KRW rate: ${exchangeRate}`)

  // 2. Google Sheets 데이터 조회
  const rows = await fetchSheetRows()
  console.log(`[sync-projects] Found ${rows.length} rows in Google Sheets`)

  // 3. 레코드 변환
  const records = []
  const parseErrors = []

  for (let i = 0; i < rows.length; i++) {
    try {
      const parsed = parseSheetRow(rows[i])
      if (parsed) records.push(parsed)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[sync-projects] Parse error at row ${i + 2}: ${message}`)
      parseErrors.push(`Row ${i + 2}: ${message}`)
    }
  }

  console.log(`[sync-projects] Parsed ${records.length} records (${parseErrors.length} parse errors)`)

  // 4. 배치 upsert
  const { upserted, errors: upsertErrors } = await batchUpsert(records)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const allErrors = [...parseErrors, ...upsertErrors]

  console.log(
    `[sync-projects] Sync complete in ${elapsed}s. Synced: ${upserted}, Errors: ${allErrors.length}, Rate: ${exchangeRate}`,
  )

  if (allErrors.length > 0) {
    console.error('[sync-projects] Errors:', allErrors.join('; '))
    await notifySlack('프로젝트 동기화', 'fail', allErrors.join('; '))
    process.exit(1)
  }

  console.log(`[sync-projects] ${upserted}건 동기화 완료 (${elapsed}s)`)
  process.exit(0)
}

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('[sync-projects] Fatal:', msg)
  await notifySlack('프로젝트 동기화', 'fail', msg)
  process.exit(1)
})
