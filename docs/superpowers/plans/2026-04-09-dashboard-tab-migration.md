# Dashboard Tab Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/projects` 데이터 소스를 `시트1` → `Dashboard` 탭으로 전환, 헤더 기반 동적 매핑 + 멀티통화 환율 지원, 캠페인 플라이휠 비활성화

**Architecture:** Google Sheet(Dashboard 탭) → 헤더 기반 동적 파서 → Supabase `projects` 테이블 → Next.js admin UI. 환율은 ECOS API(JPY/KRW + USD/KRW) → Supabase `exchange_rates` 캐시. 계산 함수는 `ExchangeRates` 객체로 3통화 합산.

**Tech Stack:** Next.js 16, TypeScript, googleapis, Supabase, ECOS API, Recharts

---

## File Structure

| File | Role | Action |
|------|------|--------|
| `lib/sheets/header-map.json` | 시트 헤더→필드 매핑 데이터 (TS/MJS 공유) | NEW |
| `lib/sheets/column-map.ts` | 매핑 로직 + buildIndexMap + parseRowDynamic | NEW |
| `lib/sheets/parsers.ts` | 기존 파서 유틸 (parseMoney, parseDate 등) | MODIFY (parseSheetRow 제거) |
| `lib/exchange-rate.ts` | 환율 조회 (JPY + USD) | MODIFY |
| `lib/dashboard/calculations.ts` | ExchangeRates 타입, 3통화 계산 | MODIFY |
| `lib/dashboard/queries.ts` | fetchExchangeRates, 캠페인 쿼리 제거 | MODIFY |
| `app/api/sync/projects/route.ts` | Dashboard 탭 + 동적 파서 + 멀티환율 | MODIFY |
| `scripts/sync-projects.mjs` | Dashboard 탭 + 동적 파서 + 멀티환율 | MODIFY |
| `app/admin/projects/page.tsx` | rates 객체 전파 | MODIFY |
| `app/admin/projects/detail/page.tsx` | rates 객체 전파 | MODIFY |
| `app/admin/page.tsx` | 인사이트 링크 제거 | MODIFY |
| `app/admin/insights/` | 전체 삭제 | DELETE |
| `app/api/sync/campaign-insights/route.ts` | 삭제 | DELETE |
| `supabase/migrations/20260409_dashboard_tab_migration.sql` | 스키마 변경 | NEW |

---

## Task 1: Supabase Schema Migration

**Files:**
- Create: `supabase/migrations/20260409_dashboard_tab_migration.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/20260409_dashboard_tab_migration.sql

-- 신규 컬럼
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_usd numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS operation_sheet text;

-- margin_jpy: 기존 데이터 보존, 새 싱크에서는 0 입력
-- 향후 DROP 가능하므로 nullable 유지
```

- [ ] **Step 2: Apply migration**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx supabase db push`

If using remote Supabase (no local), apply via Supabase Dashboard SQL Editor instead.

- [ ] **Step 3: Verify columns exist**

Run via Supabase SQL Editor or CLI:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('contract_usd', 'operation_sheet');
```

Expected: 2 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260409_dashboard_tab_migration.sql
git commit -m "feat: add contract_usd and operation_sheet columns to projects"
```

---

## Task 2: Header-Based Dynamic Parser

**Files:**
- Create: `lib/sheets/header-map.json`
- Create: `lib/sheets/column-map.ts`
- Modify: `lib/sheets/parsers.ts` (remove `parseSheetRow`, keep utility functions)

- [ ] **Step 1: Create shared header map JSON**

`lib/sheets/header-map.json`:
```json
{
  "구분-날짜": { "field": "entry_date", "type": "entry_date" },
  "구분-날짜(Y-W)": { "field": "week_code", "type": "text" },
  "코드": { "field": "row_code", "type": "text" },
  "법인명": { "field": "company_name", "type": "text" },
  "브랜드명": { "field": "brand_name", "type": "text" },
  "운영-status": { "field": "status", "type": "text" },
  "구분": { "field": "project_type", "type": "text" },
  "매체": { "field": "media", "type": "text" },
  "운영 시트": { "field": "operation_sheet", "type": "text" },
  "담당자-정": { "field": "assignee_names", "type": "assignees" },
  "담당자-부": { "field": "assignee_sub", "type": "assignees" },
  "시작일": { "field": "start_date", "type": "date" },
  "종료일": { "field": "end_date", "type": "date" },
  "비고": { "field": "note", "type": "text" },
  "계약 금액 / 원 (부가세X)": { "field": "contract_krw", "type": "money" },
  "계약 금액 / 엔 (부가세X)": { "field": "contract_jpy", "type": "money" },
  "계약 금액 / USD (부가세X)": { "field": "contract_usd", "type": "money" },
  "콜라보 수수료 금액": { "field": "collab_fee", "type": "money" },
  "지출액/원(섭외비)": { "field": "expense_krw", "type": "money" },
  "지출액/엔(섭외비)": { "field": "expense_jpy", "type": "money" },
  "마진(원으로 적용)": { "field": "margin_krw", "type": "money" },
  "견적서": { "field": "estimate_status", "type": "text" },
  "계약서": { "field": "contract_status", "type": "text" },
  "계약일자": { "field": "contract_date", "type": "date" },
  "정산예정일": { "field": "settlement_due_date", "type": "date" },
  "선금 정산일": { "field": "advance_paid_date", "type": "date" },
  "잔금 정산일": { "field": "balance_paid_date", "type": "date" },
  "계약 금액(원가)": { "field": "contract_cost", "type": "money" },
  "세금계산서 발행일": { "field": "tax_invoice_date", "type": "date" },
  "입금 여부": { "field": "payment_status", "type": "text" },
  "송금 여부": { "field": "remittance_status", "type": "text" },
  "섭외 정산": { "field": "creator_settlement_note", "type": "text" }
}
```

- [ ] **Step 2: Create column-map.ts with buildIndexMap and parseRowDynamic**

`lib/sheets/column-map.ts`:
```ts
import headerMap from './header-map.json'
import { parseMoney, parseDate, parseEntryDate, parseAssignees } from './parsers'

type FieldType = 'text' | 'date' | 'money' | 'assignees' | 'entry_date'

interface FieldDef {
  field: string
  type: FieldType
}

const HEADER_FIELD_MAP: Record<string, FieldDef> = headerMap as Record<string, FieldDef>

// 필수 컬럼 — 누락 시 에러
const REQUIRED_HEADERS = ['코드', '브랜드명']

/**
 * 헤더 행에서 { supabaseField → columnIndex } 맵을 빌드한다.
 * 필수 컬럼이 누락되면 에러를 throw한다.
 */
export function buildIndexMap(headerRow: string[]): Map<string, { index: number; type: FieldType }> {
  const map = new Map<string, { index: number; type: FieldType }>()

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i]?.trim()
    if (!header) continue
    const def = HEADER_FIELD_MAP[header]
    if (def) {
      map.set(def.field, { index: i, type: def.type })
    }
  }

  // 필수 컬럼 검증
  for (const requiredHeader of REQUIRED_HEADERS) {
    const def = HEADER_FIELD_MAP[requiredHeader]
    if (def && !map.has(def.field)) {
      throw new Error(`필수 컬럼 "${requiredHeader}" (→ ${def.field})이 시트 헤더에 없습니다`)
    }
  }

  return map
}

/**
 * 데이터 행 하나를 indexMap 기반으로 파싱한다.
 * row_code가 비어있으면 null 반환.
 */
export function parseRowDynamic(
  row: string[],
  indexMap: Map<string, { index: number; type: FieldType }>,
): Record<string, unknown> | null {
  const get = (field: string): string => {
    const entry = indexMap.get(field)
    if (!entry) return ''
    return (row[entry.index] ?? '').trim()
  }

  const getTyped = (field: string): unknown => {
    const entry = indexMap.get(field)
    if (!entry) return null
    const raw = (row[entry.index] ?? '').trim()
    if (!raw) return entry.type === 'money' ? 0 : entry.type === 'assignees' ? [] : null

    switch (entry.type) {
      case 'text': return raw
      case 'money': return parseMoney(raw)
      case 'date': return parseDate(raw)
      case 'entry_date': return parseEntryDate(raw)
      case 'assignees': return parseAssignees(raw)
      default: return raw
    }
  }

  const rowCode = get('row_code')
  if (!rowCode) return null

  const record: Record<string, unknown> = {}
  for (const [field] of indexMap) {
    record[field] = getTyped(field)
  }

  // name 필드: brand_name > company_name > row_code
  record.name = get('brand_name') || get('company_name') || rowCode

  return record
}
```

- [ ] **Step 3: Remove parseSheetRow from parsers.ts, keep utility functions**

In `lib/sheets/parsers.ts`, remove the `parseSheetRow` function (lines 36-74). Keep `parseMoney`, `parseDate`, `parseEntryDate`, `parseAssignees` — these are used by `column-map.ts`.

After removal, `parsers.ts` should contain only:
- `parseMoney` (line 1-7)
- `parseDate` (line 9-19)
- `parseEntryDate` (line 21-27)
- `parseAssignees` (line 29-33)

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors in the new files (there may be errors in files we haven't updated yet — that's OK, we fix those in later tasks).

- [ ] **Step 5: Commit**

```bash
git add lib/sheets/header-map.json lib/sheets/column-map.ts lib/sheets/parsers.ts
git commit -m "feat: header-based dynamic sheet parser with shared JSON mapping"
```

---

## Task 3: Multi-Currency Exchange Rates

**Files:**
- Modify: `lib/exchange-rate.ts`

- [ ] **Step 1: Add USD support and unified getExchangeRates function**

Replace the entire `lib/exchange-rate.ts` with:

```ts
import { createAdminClient } from "@/lib/supabase/admin";

export interface ExchangeRates {
  jpyToKrw: number;
  usdToKrw: number;
}

const FALLBACK_JPY_TO_KRW = 9.0;
const FALLBACK_USD_TO_KRW = 1350.0;

/**
 * JPY/KRW + USD/KRW 환율을 한 번에 조회한다.
 * 조회 순서: Supabase 당일 캐시 → ECOS API → 최근 캐시 → 폴백
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const [jpyToKrw, usdToKrw] = await Promise.all([
    getRate("JPY/KRW", "JPY", true, FALLBACK_JPY_TO_KRW),
    getRate("USD/KRW", "USD", false, FALLBACK_USD_TO_KRW),
  ]);
  return { jpyToKrw, usdToKrw };
}

/** 하위 호환: 기존 코드에서 JPY 환율만 필요한 경우 */
export async function getJpyToKrwRate(): Promise<number> {
  return getRate("JPY/KRW", "JPY", true, FALLBACK_JPY_TO_KRW);
}

/**
 * 단일 통화쌍 환율 조회 (공통 로직)
 * @param currencyPair  "JPY/KRW" | "USD/KRW"
 * @param ecosCurrency  ECOS API 통화 코드 ("JPY" | "USD")
 * @param divideBy100   JPY는 100엔 기준 → true, USD는 1달러 기준 → false
 * @param fallback      최종 폴백값
 */
async function getRate(
  currencyPair: string,
  ecosCurrency: string,
  divideBy100: boolean,
  fallback: number,
): Promise<number> {
  const today = getTodayDateString();

  // 1. Supabase 당일 캐시
  try {
    const supabase = createAdminClient();
    const { data: cached } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency_pair", currencyPair)
      .eq("rate_date", today)
      .maybeSingle();

    if (cached?.rate != null) {
      return cached.rate;
    }
  } catch {
    // 캐시 조회 실패 → API 호출로 진행
  }

  // 2. ECOS API
  const apiKey = process.env.BOK_ECOS_API_KEY;
  if (apiKey) {
    try {
      const rate = await fetchEcosRate(apiKey, today, ecosCurrency, divideBy100);
      if (rate != null) {
        await upsertRate(currencyPair, rate, today, "ecos");
        return rate;
      }
    } catch {
      // API 실패 → 최근 캐시로 폴백
    }
  }

  // 3. 최근 캐시
  try {
    const supabase = createAdminClient();
    const { data: recent } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency_pair", currencyPair)
      .order("rate_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.rate != null) {
      return recent.rate;
    }
  } catch {
    // 최근 캐시도 실패 → 폴백
  }

  return fallback;
}

async function fetchEcosRate(
  apiKey: string,
  date: string,
  currency: string,
  divideBy100: boolean,
): Promise<number | null> {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/1/731Y001/D/${date}/${date}/${currency}/0000003`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`ECOS API HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows = json?.StatisticSearch?.row;
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const raw = parseFloat(rows[0].DATA_VALUE);
  if (isNaN(raw)) {
    return null;
  }

  return divideBy100 ? raw / 100 : raw;
}

async function upsertRate(
  currencyPair: string,
  rate: number,
  rateDate: string,
  source: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("exchange_rates").upsert(
      {
        currency_pair: currencyPair,
        rate,
        rate_date: rateDate,
        source,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "currency_pair,rate_date" },
    );
  } catch {
    // upsert 실패는 조용히 무시
  }
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit --pretty 2>&1 | grep exchange-rate`

Expected: No errors in `exchange-rate.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/exchange-rate.ts
git commit -m "feat: add USD/KRW exchange rate support with unified getExchangeRates"
```

---

## Task 4: Update Calculations & Queries

**Files:**
- Modify: `lib/dashboard/calculations.ts`
- Modify: `lib/dashboard/queries.ts`

- [ ] **Step 1: Update calculations.ts — ExchangeRates type, 3-currency functions, remove campaign types**

Replace `lib/dashboard/calculations.ts` entirely:

```ts
export interface ExchangeRates {
  jpyToKrw: number
  usdToKrw: number
}

export interface Project {
  id: string
  row_code: string
  name: string
  entry_date: string | null
  week_code: string | null
  company_name: string | null
  brand_name: string | null
  status: string | null
  project_type: string | null
  media: string | null
  operation_sheet: string | null
  assignee_names: string[]
  assignee_sub: string[]
  start_date: string | null
  end_date: string | null
  note: string | null
  contract_krw: number
  contract_jpy: number
  contract_usd: number
  collab_fee: number
  expense_krw: number
  expense_jpy: number
  margin_krw: number
  estimate_status: string | null
  contract_status: string | null
  contract_date: string | null
  settlement_due_date: string | null
  advance_paid_date: string | null
  balance_paid_date: string | null
  contract_cost: number
  tax_invoice_date: string | null
  payment_status: string | null
  remittance_status: string | null
  creator_settlement_note: string | null
}

/** 계약 총액을 KRW로 환산 (3통화 합산) */
export function totalContractKrw(p: Project, rates: ExchangeRates): number {
  return p.contract_krw + p.contract_jpy * rates.jpyToKrw + p.contract_usd * rates.usdToKrw
}

/** 지출액 총액을 KRW로 환산 */
export function totalExpenseKrw(p: Project, rates: ExchangeRates): number {
  return p.expense_krw + p.expense_jpy * rates.jpyToKrw
}

/** 마진 총액 (시트에서 이미 원화 환산) */
export function totalMarginKrw(p: Project): number {
  return p.margin_krw
}

/** 마진율 (%). 계약금액이 0이면 0 반환 */
export function marginRate(p: Project, rates: ExchangeRates): number {
  const contract = totalContractKrw(p, rates)
  if (contract === 0) return 0
  return (totalMarginKrw(p) / contract) * 100
}

/**
 * 미수금 (KRW 기준)
 * - payment_status에 '잔금 입금 완료' 포함 → 0
 * - 그 외 → 계약 총액 전액
 */
export function receivableKrw(p: Project, rates: ExchangeRates): number {
  if (p.payment_status?.includes('잔금 입금 완료')) return 0
  return totalContractKrw(p, rates)
}

/** 프로젝트 기간 (일수). start_date 또는 end_date가 없으면 null */
export function projectDurationDays(p: Project): number | null {
  if (!p.start_date || !p.end_date) return null
  const start = new Date(p.start_date).getTime()
  const end = new Date(p.end_date).getTime()
  const diffMs = end - start
  if (isNaN(diffMs) || diffMs < 0) return null
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
```

Key changes:
- `totalContractKrw(p, rates)` — 3통화 합산, `rates: ExchangeRates` 파라미터
- `totalExpenseKrw(p, rates)` — `rates` 파라미터
- `totalMarginKrw(p)` — `margin_krw`만 사용, `rate` 파라미터 제거
- `marginRate(p, rates)` — `rates` 파라미터
- `receivableKrw(p, rates)` — `rates` 파라미터
- `Project` interface: `contract_usd`, `operation_sheet` 추가, `margin_jpy` 제거
- Campaign types/functions 전부 제거

- [ ] **Step 2: Update queries.ts — fetchExchangeRates, remove campaign queries**

Replace `lib/dashboard/queries.ts` entirely:

```ts
import { supabase } from '@/lib/supabase/client'
import type { Project, ExchangeRates } from './calculations'

/** 전체 프로젝트 목록 조회 (클라이언트 전용) */
export async function fetchAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[fetchAllProjects] 조회 실패:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id ?? '',
    row_code: row.row_code ?? '',
    name: row.brand_name || row.company_name || row.row_code || '',
    entry_date: row.entry_date ?? null,
    week_code: row.week_code ?? null,
    company_name: row.company_name ?? null,
    brand_name: row.brand_name ?? null,
    status: row.status ?? null,
    project_type: row.project_type ?? null,
    media: row.media ?? null,
    operation_sheet: row.operation_sheet ?? null,
    assignee_names: Array.isArray(row.assignee_names) ? row.assignee_names : [],
    assignee_sub: Array.isArray(row.assignee_sub) ? row.assignee_sub : [],
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    note: row.note ?? null,
    contract_krw: Number(row.contract_krw ?? 0),
    contract_jpy: Number(row.contract_jpy ?? 0),
    contract_usd: Number(row.contract_usd ?? 0),
    collab_fee: Number(row.collab_fee ?? 0),
    expense_krw: Number(row.expense_krw ?? 0),
    expense_jpy: Number(row.expense_jpy ?? 0),
    margin_krw: Number(row.margin_krw ?? 0),
    estimate_status: row.estimate_status ?? null,
    contract_status: row.contract_status ?? null,
    contract_date: row.contract_date ?? null,
    settlement_due_date: row.settlement_due_date ?? null,
    advance_paid_date: row.advance_paid_date ?? null,
    balance_paid_date: row.balance_paid_date ?? null,
    contract_cost: Number(row.contract_cost ?? 0),
    tax_invoice_date: row.tax_invoice_date ?? null,
    payment_status: row.payment_status ?? null,
    remittance_status: row.remittance_status ?? null,
    creator_settlement_note: row.creator_settlement_note ?? null,
  })) as Project[]
}

/**
 * 최신 JPY/KRW + USD/KRW 환율 조회 (클라이언트용)
 * exchange_rates 테이블에서 각 통화쌍의 가장 최근 레코드 사용.
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const FALLBACK: ExchangeRates = { jpyToKrw: 9.0, usdToKrw: 1350.0 }

  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('currency_pair, rate')
      .in('currency_pair', ['JPY/KRW', 'USD/KRW'])
      .order('rate_date', { ascending: false })

    if (error || !data || data.length === 0) {
      console.warn('[fetchExchangeRates] 조회 실패, 폴백 사용:', error?.message)
      return FALLBACK
    }

    // 각 통화쌍의 첫 번째(최신) 레코드 사용
    const jpyRow = data.find((r) => r.currency_pair === 'JPY/KRW')
    const usdRow = data.find((r) => r.currency_pair === 'USD/KRW')

    const jpyRate = jpyRow ? Number(jpyRow.rate) : FALLBACK.jpyToKrw
    const usdRate = usdRow ? Number(usdRow.rate) : FALLBACK.usdToKrw

    return {
      jpyToKrw: isNaN(jpyRate) || jpyRate <= 0 ? FALLBACK.jpyToKrw : jpyRate,
      usdToKrw: isNaN(usdRate) || usdRate <= 0 ? FALLBACK.usdToKrw : usdRate,
    }
  } catch (err) {
    console.warn('[fetchExchangeRates] 예외 발생, 폴백 사용:', err)
    return FALLBACK
  }
}
```

Key changes:
- `fetchLatestExchangeRate()` → `fetchExchangeRates()` returning `ExchangeRates`
- `contract_usd`, `operation_sheet` 매핑 추가
- `margin_jpy` 제거
- `fetchCampaignPosts`, `fetchCampaignFinancials`, `fetchCampaignReviews` 전부 제거

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit --pretty 2>&1 | head -30`

There WILL be errors in `page.tsx` and `detail/page.tsx` — those use the old `rate: number` signature. That's expected and fixed in Task 6.

- [ ] **Step 4: Commit**

```bash
git add lib/dashboard/calculations.ts lib/dashboard/queries.ts
git commit -m "feat: multi-currency calculations and remove campaign queries"
```

---

## Task 5: Update Sync Endpoints

**Files:**
- Modify: `app/api/sync/projects/route.ts`
- Modify: `scripts/sync-projects.mjs`

- [ ] **Step 1: Update API route to use Dashboard tab + dynamic parser**

Replace `app/api/sync/projects/route.ts` entirely:

```ts
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
```

- [ ] **Step 2: Update sync-projects.mjs — Dashboard tab + dynamic parser**

In `scripts/sync-projects.mjs`, make these changes:

**a) Add header-map.json import and parser functions at the top (after line 20):**

```js
import { readFileSync as readFs } from 'fs'

const headerMap = JSON.parse(
  readFs(resolve(__dirname, '..', 'lib', 'sheets', 'header-map.json'), 'utf8'),
)
```

**b) Replace `parseSheetRow` function (lines 87-124) with dynamic parser:**

```js
// ─── Dynamic parser (header-based) ────────────────────────
function buildIndexMap(headerRow) {
  const map = new Map()
  for (let i = 0; i < headerRow.length; i++) {
    const header = (headerRow[i] ?? '').trim()
    if (!header) continue
    const def = headerMap[header]
    if (def) {
      map.set(def.field, { index: i, type: def.type })
    }
  }
  // 필수 컬럼 검증
  for (const requiredHeader of ['코드', '브랜드명']) {
    const def = headerMap[requiredHeader]
    if (def && !map.has(def.field)) {
      throw new Error(`필수 컬럼 "${requiredHeader}" (→ ${def.field})이 시트 헤더에 없습니다`)
    }
  }
  return map
}

function parseRowDynamic(row, indexMap) {
  const get = (field) => {
    const entry = indexMap.get(field)
    if (!entry) return ''
    return (row[entry.index] ?? '').trim()
  }
  const getTyped = (field) => {
    const entry = indexMap.get(field)
    if (!entry) return null
    const raw = (row[entry.index] ?? '').trim()
    if (!raw) return entry.type === 'money' ? 0 : entry.type === 'assignees' ? [] : null
    switch (entry.type) {
      case 'text': return raw
      case 'money': return parseMoney(raw)
      case 'date': return parseDate(raw)
      case 'entry_date': return parseEntryDate(raw)
      case 'assignees': return parseAssignees(raw)
      default: return raw
    }
  }
  const rowCode = get('row_code')
  if (!rowCode) return null
  const record = {}
  for (const [field] of indexMap) {
    record[field] = getTyped(field)
  }
  record.name = get('brand_name') || get('company_name') || rowCode
  return record
}
```

**c) Replace `fetchSheetRows` (line 275-286) to return header + data separately:**

```js
async function fetchSheetData() {
  const { data } = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_PROJECT_ID,
        range: 'Dashboard!A:AJ',
        valueRenderOption: 'FORMATTED_VALUE',
      }),
    'Google Sheets fetch',
  )
  const values = data.values ?? []
  if (values.length < 2) return { headerRow: [], dataRows: [] }
  return { headerRow: values[0], dataRows: values.slice(1) }
}
```

**d) Add USD exchange rate function after `getJpyToKrwRate` (after line 271):**

```js
const FALLBACK_USD_TO_KRW = 1350.0

async function getUsdToKrwRate() {
  const today = new Date().toISOString().slice(0, 10)

  // 1. Supabase 당일 캐시
  try {
    const { data: cached } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('currency_pair', 'USD/KRW')
      .eq('rate_date', today)
      .maybeSingle()
    if (cached?.rate != null) return cached.rate
  } catch {}

  // 2. ECOS API (USD는 1달러 기준이므로 /100 불필요)
  const apiKey = process.env.BOK_ECOS_API_KEY
  if (apiKey) {
    try {
      const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/1/731Y001/D/${today}/${today}/USD/0000003`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        const rows = json?.StatisticSearch?.row
        if (Array.isArray(rows) && rows.length > 0) {
          const raw = parseFloat(rows[0].DATA_VALUE)
          if (!isNaN(raw)) {
            await supabase.from('exchange_rates').upsert(
              {
                currency_pair: 'USD/KRW',
                rate: raw,
                rate_date: today,
                source: 'ecos',
                fetched_at: new Date().toISOString(),
              },
              { onConflict: 'currency_pair,rate_date' },
            )
            return raw
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
      .eq('currency_pair', 'USD/KRW')
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (recent?.rate != null) return recent.rate
  } catch {}

  return FALLBACK_USD_TO_KRW
}
```

**e) Update `main()` function (line 322-371) to use new parser and dual rates:**

```js
async function main() {
  await waitForNetwork()
  const startTime = Date.now()
  console.log(`[sync-projects] Starting project sync at ${new Date().toISOString()}`)

  // 1. 환율 (JPY + USD)
  const [jpyRate, usdRate] = await Promise.all([getJpyToKrwRate(), getUsdToKrwRate()])
  console.log(`[sync-projects] Rates: JPY→KRW ${jpyRate}, USD→KRW ${usdRate}`)

  // 2. Google Sheets 데이터 조회 (Dashboard 탭)
  const { headerRow, dataRows } = await fetchSheetData()
  if (dataRows.length === 0) {
    console.log('[sync-projects] No data rows found')
    process.exit(0)
  }

  // 3. 헤더 기반 인덱스 맵 빌드
  const indexMap = buildIndexMap(headerRow)
  console.log(`[sync-projects] Found ${dataRows.length} rows, ${indexMap.size} mapped columns`)

  // 4. 레코드 변환 (row_code 중복 시 마지막 행 우선)
  const recordMap = new Map()
  const parseErrors = []

  for (let i = 0; i < dataRows.length; i++) {
    try {
      const parsed = parseRowDynamic(dataRows[i], indexMap)
      if (parsed) recordMap.set(parsed.row_code, parsed)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[sync-projects] Parse error at row ${i + 2}: ${message}`)
      parseErrors.push(`Row ${i + 2}: ${message}`)
    }
  }

  const records = [...recordMap.values()]
  console.log(`[sync-projects] Parsed ${records.length} unique records (${parseErrors.length} parse errors)`)

  // 5. 배치 upsert
  const { upserted, errors: upsertErrors } = await batchUpsert(records)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const allErrors = [...parseErrors, ...upsertErrors]

  console.log(
    `[sync-projects] Sync complete in ${elapsed}s. Synced: ${upserted}, Errors: ${allErrors.length}`,
  )

  if (allErrors.length > 0) {
    console.error('[sync-projects] Errors:', allErrors.join('; '))
    await notifySlack('프로젝트 동기화', 'fail', allErrors.join('; '))
    process.exit(1)
  }

  console.log(`[sync-projects] ${upserted}건 동기화 완료 (${elapsed}s)`)
  process.exit(0)
}
```

- [ ] **Step 3: Test sync endpoint locally**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && node scripts/sync-projects.mjs`

Expected: `[sync-projects] N건 동기화 완료` with no errors. Verify Dashboard tab data flows through.

- [ ] **Step 4: Commit**

```bash
git add app/api/sync/projects/route.ts scripts/sync-projects.mjs
git commit -m "feat: switch sync to Dashboard tab with header-based dynamic parser"
```

---

## Task 6: Update Admin UI Pages

**Files:**
- Modify: `app/admin/projects/page.tsx`
- Modify: `app/admin/projects/detail/page.tsx`

- [ ] **Step 1: Update projects/page.tsx — rates object**

In `app/admin/projects/page.tsx`:

**a) Change imports (line 7):**
```ts
// Before:
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
// After:
import { fetchAllProjects, fetchExchangeRates } from '@/lib/dashboard/queries'
```

**b) Change import from calculations (line 8):**
```ts
// Before:
import { totalContractKrw, totalExpenseKrw, totalMarginKrw, marginRate, receivableKrw, type Project } from '@/lib/dashboard/calculations'
// After:
import { totalContractKrw, totalExpenseKrw, totalMarginKrw, marginRate, receivableKrw, type Project, type ExchangeRates } from '@/lib/dashboard/calculations'
```

**c) Change state (line 48):**
```ts
// Before:
const [rate, setRate] = useState<number>(9.0)
// After:
const [rates, setRates] = useState<ExchangeRates>({ jpyToKrw: 9.0, usdToKrw: 1350.0 })
```

**d) Change loadData (lines 52-57):**
```ts
async function loadData() {
  const [all, r] = await Promise.all([fetchAllProjects(), fetchExchangeRates()])
  setProjects(all)
  setRates(r)
  setLoading(false)
}
```

**e) Replace all `rate` with `rates` in calculation calls (lines 107-168):**

Every occurrence of:
- `totalContractKrw(p, rate)` → `totalContractKrw(p, rates)`
- `totalExpenseKrw(p, rate)` → `totalExpenseKrw(p, rates)`
- `totalMarginKrw(p, rate)` → `totalMarginKrw(p)`
- `marginRate(p, rate)` → `marginRate(p, rates)`
- `receivableKrw(p, rate)` → `receivableKrw(p, rates)`

**f) Update subtitle (line 214):**
```ts
// Before:
subtitle={`환율: ¥1 = ₩${rate}`}
// After:
subtitle={`¥1=₩${rates.jpyToKrw} / $1=₩${rates.usdToKrw}`}
```

- [ ] **Step 2: Update detail/page.tsx — rates object**

In `app/admin/projects/detail/page.tsx`:

**a) Change imports (line 7-8):**
```ts
import { fetchAllProjects, fetchExchangeRates } from '@/lib/dashboard/queries'
import {
  totalContractKrw,
  totalExpenseKrw,
  totalMarginKrw,
  marginRate,
  receivableKrw,
  type Project,
  type ExchangeRates,
} from '@/lib/dashboard/calculations'
```

**b) Change state in DetailContent (line 583):**
```ts
// Before:
const [rate, setRate] = useState<number>(9.0)
// After:
const [rates, setRates] = useState<ExchangeRates>({ jpyToKrw: 9.0, usdToKrw: 1350.0 })
```

**c) Change loadData (line 586-594):**
```ts
useEffect(() => {
  async function load() {
    const [all, r] = await Promise.all([fetchAllProjects(), fetchExchangeRates()])
    setProjects(all)
    setRates(r)
    setLoading(false)
  }
  load()
}, [])
```

**d) Change all 5 view component props from `rate={rate}` to `rates={rates}`:**
```ts
{view === 'total' && <TotalView projects={projects} rates={rates} />}
{view === 'active' && <ActiveView projects={projects} rates={rates} />}
{view === 'contract' && <ContractView projects={projects} rates={rates} />}
{view === 'receivable' && <ReceivableView projects={projects} rates={rates} />}
{view === 'margin' && <MarginView projects={projects} rates={rates} />}
```

**e) Change all 5 view component signatures:**
Every `{ projects, rate }: { projects: Project[]; rate: number }` becomes `{ projects, rates }: { projects: Project[]; rates: ExchangeRates }`.

**f) Replace all calculation calls within each view:**
- `totalContractKrw(a, rate)` → `totalContractKrw(a, rates)`
- `totalExpenseKrw(a, rate)` → `totalExpenseKrw(a, rates)`
- `totalMarginKrw(a, rate)` → `totalMarginKrw(a)`
- `marginRate(a, rate)` → `marginRate(a, rates)`
- `receivableKrw(p, rate)` → `receivableKrw(p, rates)`

**g) Update footer text in MarginView (line 556):**
```ts
// Before:
<p>...환율 ¥1 = ₩{rate}</p>
// After:
<p>...환율 ¥1=₩{rates.jpyToKrw} / $1=₩{rates.usdToKrw}</p>
```

- [ ] **Step 3: Verify TypeScript compiles clean**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit --pretty`

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/projects/page.tsx app/admin/projects/detail/page.tsx
git commit -m "feat: propagate ExchangeRates to admin project pages"
```

---

## Task 7: Deactivate Campaign Flywheel

**Files:**
- Delete: `app/admin/insights/page.tsx`
- Delete: `app/admin/insights/components/campaign-table.tsx`
- Delete: `app/admin/insights/components/creator-report.tsx`
- Delete: `app/admin/insights/components/trend-charts.tsx`
- Delete: `app/api/sync/campaign-insights/route.ts`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Delete insights page and components**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
rm -rf app/admin/insights/
rm -f app/api/sync/campaign-insights/route.ts
```

- [ ] **Step 2: Remove insights link from admin hub**

In `app/admin/page.tsx`, remove the entire "캠페인 인사이트" Link block (lines 65-89) and the `BarChart3` import.

After edit, the imports should be:
```ts
import Link from 'next/link'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
```

And the grid should have only 2 cards: 콘텐츠 관리 + 프로젝트 현황. Change `sm:grid-cols-2` to keep 2-column layout.

- [ ] **Step 3: Verify build**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx next build 2>&1 | tail -20`

Expected: Build succeeds with no missing module errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: deactivate campaign flywheel, remove insights page"
```

---

## Task 8: End-to-End Verification

- [ ] **Step 1: Run sync and verify data**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
node scripts/sync-projects.mjs
```

Expected: `N건 동기화 완료` with 0 errors. Check Supabase `projects` table for `contract_usd` and `operation_sheet` values.

- [ ] **Step 2: Start dev server and check admin pages**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npm run dev
```

Open `http://localhost:3000/admin/projects`:
- KPI cards show updated numbers
- Exchange rate subtitle shows both JPY and USD rates
- Charts render correctly
- Sync button works

Open `http://localhost:3000/admin/projects/detail?view=margin`:
- MarginView shows correct margin calculations
- Footer shows dual exchange rates

Open `http://localhost:3000/admin`:
- Only 2 cards (콘텐츠 관리 + 프로젝트 현황), no 인사이트

Open `http://localhost:3000/admin/insights`:
- Should return 404

- [ ] **Step 3: Verify production build**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: e2e verification fixes for dashboard migration"
```
