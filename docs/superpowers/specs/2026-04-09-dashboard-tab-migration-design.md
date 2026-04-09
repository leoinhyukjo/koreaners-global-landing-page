# Dashboard Tab Migration Design

> `/admin/projects` 데이터 소스를 `시트1` → `Dashboard` 탭으로 전환하고,
> 헤더 기반 동적 매핑 + 멀티통화 환율 지원을 추가한다.
> 캠페인 성과 플라이휠(`/admin/insights`)은 비활성화한다.

## Background

- `/admin/projects`는 Google Sheet `1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4`의 `시트1` 탭을 소스로 사용 중
- 3/23 이후 시트 컬럼 변경으로 싱크가 깨져 launchd 중단, 스냅샷 데이터만 표시 중
- 실제 운영 데이터는 `Dashboard` 탭(A~AJ, 36 컬럼)에 있음
- 기존 파서는 매직넘버 인덱스 하드코딩 → 컬럼 변경에 취약

## Dashboard Tab Schema (A~AJ)

| Col | Index | Header | Supabase Field | Type |
|-----|-------|--------|----------------|------|
| A | 0 | 구분-날짜 | entry_date | date |
| B | 1 | 구분-날짜(Y-W) | week_code | text |
| C | 2 | 코드 | row_code (PK) | text |
| D | 3 | 법인명 | company_name | text |
| E | 4 | 브랜드명 | brand_name | text |
| F | 5 | 운영-status | status | text |
| G | 6 | 구분 | project_type | text |
| H | 7 | 매체 | media | text |
| I | 8 | 운영 시트 | operation_sheet | text |
| J | 9 | 담당자-정 | assignee_names | text[] |
| K | 10 | 담당자-부 | assignee_sub | text[] |
| L | 11 | 시작일 | start_date | date |
| M | 12 | 종료일 | end_date | date |
| N | 13 | 비고 | note | text |
| O | 14 | *(empty)* | — | — |
| P | 15 | 계약 금액 / 원 (부가세X) | contract_krw | numeric |
| Q | 16 | 계약 금액 / 엔 (부가세X) | contract_jpy | numeric |
| R | 17 | 계약 금액 / USD (부가세X) | contract_usd | numeric |
| S | 18 | 콜라보 수수료 금액 | collab_fee | numeric |
| T | 19 | 지출액/원(섭외비) | expense_krw | numeric |
| U | 20 | 지출액/엔(섭외비) | expense_jpy | numeric |
| V | 21 | 마진(원으로 적용) | margin_krw | numeric |
| W | 22 | *(empty)* | — | — |
| X | 23 | 견적서 | estimate_status | text |
| Y | 24 | 계약서 | contract_status | text |
| Z | 25 | 계약일자 | contract_date | date |
| AA | 26 | 정산예정일 | settlement_due_date | date |
| AB | 27 | 선금 정산일 | advance_paid_date | date |
| AC | 28 | 잔금 정산일 | balance_paid_date | date |
| AD | 29 | 계약 금액(원가) | contract_cost | numeric |
| AE | 30 | 세금계산서 발행일 | tax_invoice_date | date |
| AF | 31 | 입금 여부 | payment_status | text |
| AG | 32 | 송금 여부 | remittance_status | text |
| AH | 33 | *(empty)* | — | — |
| AI | 34 | 섭외 정산 | creator_settlement_note | text |
| AJ | 35 | 환율 | — (reference only) | numeric |

## 1. Header-Based Dynamic Parser

### Problem
기존 `parsers.ts`는 `row[15]`, `row[17]` 등 매직넘버 인덱스로 접근.
컬럼 하나 추가/삭제되면 전체 매핑이 밀림 → 3/23 사고 원인.

### Solution
헤더 행을 먼저 읽어 `컬럼명 → 인덱스` 맵을 런타임에 빌드.

**New file: `lib/sheets/column-map.ts`**

```ts
// 시트 헤더명 → Supabase 필드명 + 파서 타입
export const HEADER_FIELD_MAP: Record<string, { field: string; type: 'text' | 'date' | 'money' | 'assignees' }> = {
  '코드':                        { field: 'row_code',               type: 'text' },
  '법인명':                      { field: 'company_name',           type: 'text' },
  '브랜드명':                    { field: 'brand_name',             type: 'text' },
  '운영-status':                 { field: 'status',                 type: 'text' },
  '구분':                        { field: 'project_type',           type: 'text' },
  '매체':                        { field: 'media',                  type: 'text' },
  '운영 시트':                   { field: 'operation_sheet',        type: 'text' },
  '담당자-정':                   { field: 'assignee_names',         type: 'assignees' },
  '담당자-부':                   { field: 'assignee_sub',           type: 'assignees' },
  '시작일':                      { field: 'start_date',             type: 'date' },
  '종료일':                      { field: 'end_date',               type: 'date' },
  '비고':                        { field: 'note',                   type: 'text' },
  '계약 금액 / 원 (부가세X)':    { field: 'contract_krw',           type: 'money' },
  '계약 금액 / 엔 (부가세X)':    { field: 'contract_jpy',           type: 'money' },
  '계약 금액 / USD (부가세X)':   { field: 'contract_usd',           type: 'money' },
  '콜라보 수수료 금액':           { field: 'collab_fee',             type: 'money' },
  '지출액/원(섭외비)':            { field: 'expense_krw',            type: 'money' },
  '지출액/엔(섭외비)':            { field: 'expense_jpy',            type: 'money' },
  '마진(원으로 적용)':            { field: 'margin_krw',             type: 'money' },
  '견적서':                      { field: 'estimate_status',        type: 'text' },
  '계약서':                      { field: 'contract_status',        type: 'text' },
  '계약일자':                    { field: 'contract_date',          type: 'date' },
  '정산예정일':                  { field: 'settlement_due_date',    type: 'date' },
  '선금 정산일':                 { field: 'advance_paid_date',      type: 'date' },
  '잔금 정산일':                 { field: 'balance_paid_date',      type: 'date' },
  '계약 금액(원가)':             { field: 'contract_cost',          type: 'money' },
  '세금계산서 발행일':           { field: 'tax_invoice_date',       type: 'date' },
  '입금 여부':                   { field: 'payment_status',         type: 'text' },
  '송금 여부':                   { field: 'remittance_status',      type: 'text' },
  '섭외 정산':                   { field: 'creator_settlement_note', type: 'text' },
}
```

**Runtime flow:**
1. `sheets.spreadsheets.values.get({ range: 'Dashboard!A:AJ' })` → rows
2. `buildIndexMap(rows[0])` → `{ row_code: 2, company_name: 3, ... }`
3. `parseRow(row, indexMap)` → Supabase record (type-aware parsing per field)

`구분-날짜` (A열)은 별도 처리: `parseEntryDate()` 적용.

### Validation
`buildIndexMap()`에서 필수 컬럼(`코드`, `브랜드명`) 누락 시 에러 throw + Slack 알림.

## 2. Multi-Currency Exchange Rates

### Problem
현재 JPY/KRW만 지원. Dashboard에 USD 계약 금액 존재.

### Solution
`lib/exchange-rate.ts` 확장:

- `getUsdToKrwRate()` 추가 — ECOS API 동일 통계표 `731Y001`, 통화코드 `USD`
  - USD는 1달러 기준이므로 `/100` 변환 불필요 (JPY만 100엔 기준)
- 통합 함수 `getExchangeRates(): Promise<{ jpyToKrw: number; usdToKrw: number }>`
- `exchange_rates` 테이블에 `USD/KRW` 페어 캐싱 (기존 구조 그대로)
- 폴백값: JPY=9.0, USD=1350.0

### UI 전파
- `fetchLatestExchangeRate()` → `fetchExchangeRates()` 반환 타입 변경
- `page.tsx`에서 `rate` → `{ jpyRate, usdRate }` 로 변경
- 미수금 KPI subtitle: `환율: ¥1=₩{jpyRate} / $1=₩{usdRate}`

## 3. Supabase Schema Changes

```sql
-- Migration: 20260409_dashboard_tab_migration.sql

-- 신규 컬럼
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_usd numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS operation_sheet text;

-- margin_jpy: nullable 유지, 새 싱크에서는 0 입력 (기존 데이터 보존)
-- 향후 정리 시 DROP 가능
```

## 4. Calculation Logic Changes

`lib/dashboard/calculations.ts`:

```ts
interface ExchangeRates { jpyToKrw: number; usdToKrw: number }

// 3통화 합산
function totalContractKrw(p: Project, rates: ExchangeRates): number {
  return p.contract_krw + p.contract_jpy * rates.jpyToKrw + p.contract_usd * rates.usdToKrw
}

// 마진: 시트에서 이미 원화 환산 → 단일값
function totalMarginKrw(p: Project): number {
  return p.margin_krw
}

// 지출: JPY 지출만 환산 (USD 지출 컬럼은 시트에 없음)
function totalExpenseKrw(p: Project, rates: ExchangeRates): number {
  return p.expense_krw + p.expense_jpy * rates.jpyToKrw
}
```

`Project` interface에 `contract_usd: number` 추가, `margin_jpy` 제거.

## 5. Sync Endpoint Updates

### `app/api/sync/projects/route.ts`
- Range: `Dashboard!A:AJ`
- 헤더 기반 파서 사용 (`buildIndexMap` + `parseRow`)
- `getExchangeRates()` 호출하여 환율 캐싱 (싱크 시점)
- 응답에 `exchangeRates: { jpyToKrw, usdToKrw }` 포함

### `scripts/sync-projects.mjs`
- 동일하게 Dashboard 탭 + 헤더 기반 파서
- ESM이므로 `column-map.ts`의 매핑을 JS로 복제하거나, 공유 JSON 파일로 추출
  - **결정: 공유 JSON (`lib/sheets/header-map.json`)으로 추출** → TS/MJS 양쪽에서 import

## 6. Campaign Flywheel Deactivation

- `/admin/insights` 페이지: UI 제거 (파일 삭제 또는 "준비 중" placeholder)
- `/admin` 허브: "캠페인 인사이트" 링크 제거
- `/api/sync/campaign-insights/route.ts`: 제거
- `campaign_posts`, `campaign_financials`, `campaign_reviews` 테이블: **유지** (데이터 보존)
- Python ETL (`scripts/campaign-flywheel/`): 코드 유지, launchd는 이미 중단 상태
- `lib/dashboard/queries.ts`에서 `fetchCampaignPosts`, `fetchCampaignFinancials`, `fetchCampaignReviews` 제거
- `lib/dashboard/calculations.ts`에서 `CampaignPostRow`, `CampaignFinancialRow`, 관련 함수 제거

## 7. Files Changed

| File | Action |
|------|--------|
| `lib/sheets/column-map.ts` | **NEW** — 헤더→필드 매핑 정의 |
| `lib/sheets/header-map.json` | **NEW** — TS/MJS 공유 매핑 데이터 |
| `lib/sheets/parsers.ts` | **REWRITE** — 헤더 기반 동적 파서 |
| `lib/exchange-rate.ts` | **EXTEND** — USD/KRW 추가, 통합 함수 |
| `lib/dashboard/calculations.ts` | **MODIFY** — ExchangeRates 타입, contract_usd, margin_jpy 제거, 캠페인 타입/함수 제거 |
| `lib/dashboard/queries.ts` | **MODIFY** — fetchExchangeRates, 캠페인 쿼리 제거, contract_usd 매핑 |
| `app/api/sync/projects/route.ts` | **MODIFY** — Dashboard 탭, 헤더 기반 파서, 멀티환율 |
| `scripts/sync-projects.mjs` | **MODIFY** — Dashboard 탭, 헤더 기반 파서 |
| `app/admin/projects/page.tsx` | **MODIFY** — rates 객체 전파 |
| `app/admin/projects/detail/page.tsx` | **MODIFY** — rates 객체 전파 |
| `app/admin/page.tsx` | **MODIFY** — 인사이트 링크 제거 |
| `app/admin/insights/` | **DELETE** — 전체 디렉토리 |
| `app/api/sync/campaign-insights/route.ts` | **DELETE** |
| `supabase/migrations/20260409_dashboard_tab_migration.sql` | **NEW** |

## 8. What Does NOT Change

- `exchange_rates` 테이블 구조 (USD 페어만 추가 저장)
- Admin auth 구조
- KPI 대시보드 UI 컴포넌트 (KpiCard, charts)
- `DashboardTabs` 컴포넌트
- Python ETL 코드 (유지, 비활성)
- Supabase campaign 테이블 (데이터 보존)
