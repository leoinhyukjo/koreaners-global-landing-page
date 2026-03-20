# Sheets 데이터소스 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 마스터 대시보드의 데이터소스를 Notion에서 Google Sheets로 전환한다.

**Architecture:** 기존 파이프라인(sync script → Supabase → 대시보드)을 유지하되 수집 레이어만 교체. sync-projects.mjs에서 Notion SDK 대신 Google Sheets API(서비스 계정)로 데이터를 읽고, 파싱 후 Supabase에 upsert. 프론트엔드는 필드명/계산 함수만 조정.

**Tech Stack:** googleapis, @supabase/supabase-js, Next.js App Router, recharts

**Spec:** `docs/superpowers/specs/2026-03-20-sheets-datasource-migration-design.md`

---

## 파일 구조

| 파일 | 역할 | 변경 유형 |
|------|------|----------|
| `lib/sheets/parsers.ts` | 시트 행 파싱 유틸리티 (금액, 날짜, 담당자) | 신규 |
| `scripts/sync-projects.mjs` | 시트→Supabase 동기화 스크립트 | 전면 재작성 |
| `app/api/sync/projects/route.ts` | 어드민 동기화 버튼 API | 전면 재작성 |
| `lib/dashboard/calculations.ts` | Project 인터페이스 + 계산 함수 | 수정 |
| `lib/dashboard/queries.ts` | Supabase 쿼리 + 필드 매핑 | 수정 |
| `app/admin/projects/page.tsx` | 대시보드 메인 | 수정 |
| `app/admin/projects/detail/page.tsx` | 상세 뷰 5종 | 수정 |
| `components/admin/dashboard/project-table.tsx` | 프로젝트 테이블 (미사용 — 삭제 대상) | 삭제 |

---

## Task 1: Supabase 스키마 마이그레이션

**Files:**
- Supabase SQL Editor (원격)

- [ ] **Step 1: 기존 데이터 백업**

Supabase Dashboard → SQL Editor에서 실행:
```sql
CREATE TABLE projects_backup AS SELECT * FROM projects;
```

- [ ] **Step 2: 기존 데이터 삭제 + 칼럼 변경**

```sql
TRUNCATE projects;

ALTER TABLE projects
  DROP COLUMN IF EXISTS notion_id,
  DROP COLUMN IF EXISTS parent_notion_id,
  DROP COLUMN IF EXISTS team,
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS advance_payment_krw,
  DROP COLUMN IF EXISTS advance_payment_jpy,
  DROP COLUMN IF EXISTS creator_settlement_krw,
  DROP COLUMN IF EXISTS creator_settlement_jpy,
  DROP COLUMN IF EXISTS influencer_info,
  DROP COLUMN IF EXISTS settlement_progress,
  DROP COLUMN IF EXISTS client_settlement,
  DROP COLUMN IF EXISTS tax_invoice_status,
  DROP COLUMN IF EXISTS project_type;
```

참고: `project_type`은 기존 `text[]` → Step 3에서 `text`로 재생성됨.

- [ ] **Step 3: 신규 칼럼 추가**

```sql
ALTER TABLE projects
  ADD COLUMN row_code text UNIQUE,
  ADD COLUMN entry_date date,
  ADD COLUMN week_code text,
  ADD COLUMN company_name text,
  ADD COLUMN project_type text,
  ADD COLUMN media text,
  ADD COLUMN collab_fee numeric DEFAULT 0,
  ADD COLUMN expense_krw numeric DEFAULT 0,
  ADD COLUMN expense_jpy numeric DEFAULT 0,
  ADD COLUMN margin_krw numeric DEFAULT 0,
  ADD COLUMN margin_jpy numeric DEFAULT 0,
  ADD COLUMN assignee_sub text[] DEFAULT '{}',
  ADD COLUMN contract_date date,
  ADD COLUMN settlement_due_date date,
  ADD COLUMN advance_paid_date date,
  ADD COLUMN balance_paid_date date,
  ADD COLUMN contract_cost numeric DEFAULT 0,
  ADD COLUMN tax_invoice_date date,
  ADD COLUMN payment_status text,
  ADD COLUMN remittance_status text,
  ADD COLUMN creator_settlement_note text;
```

- [ ] **Step 4: 검증**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'projects' ORDER BY ordinal_position;
```

`row_code` UNIQUE 제약 조건, 모든 신규 칼럼 존재 확인.

---

## Task 2: googleapis 패키지 설치 + 환경변수

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: googleapis 설치**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
npm install googleapis
```

- [ ] **Step 2: .env.local에 환경변수 추가**

```bash
# .env.local에 추가
GOOGLE_SERVICE_ACCOUNT_JSON="/Users/leo/Downloads/Claude-Projects/work-scripts/scripts/credentials.json"
GOOGLE_SHEETS_PROJECT_ID="1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4"
```

- [ ] **Step 3: 시트에 서비스 계정 공유**

Google Sheets "MKT Ops Master"에서 `claude@root-unison-487006-k8.iam.gserviceaccount.com`을 뷰어로 공유. (Leo님 수동 작업)

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: add googleapis dependency for sheets sync"
```

---

## Task 3: 시트 파싱 유틸리티

**Files:**
- Create: `lib/sheets/parsers.ts`

- [ ] **Step 1: parsers.ts 작성**

```typescript
// lib/sheets/parsers.ts

/** 금액 문자열 → 숫자. ₩, ¥, 쉼표 제거 후 parseFloat. NaN이면 0. */
export function parseMoney(raw: string | undefined | null): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[₩¥\\,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/** 날짜 문자열 → ISO date (YYYY-MM-DD) 또는 null.
 *  지원 형식: "2026. 1. 1", "2026.01.31", "2026/01/31" */
export function parseDate(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null
  const m = raw.match(/(\d{4})[.\s/]+(\d{1,2})[.\s/]+(\d{1,2})/)
  if (!m) return null
  const yyyy = m[1]
  const mm = m[2].padStart(2, '0')
  const dd = m[3].padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** A열 날짜 파싱: "2026-03-16 월" → "2026-03-16" */
export function parseEntryDate(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null
  const dateStr = raw.split(' ')[0]
  // 이미 ISO 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return parseDate(dateStr)
}

/** 담당자 문자열 → 배열. 쉼표 split + trim + 빈 문자열 필터 */
export function parseAssignees(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

/** 시트 행(배열)을 Supabase 레코드 객체로 변환 */
export function parseSheetRow(row: string[]): Record<string, unknown> | null {
  const code = row[2]?.trim()
  if (!code) return null // C열 빈 행 스킵

  return {
    row_code: code,
    entry_date: parseEntryDate(row[0]),
    week_code: row[1]?.trim() || null,
    company_name: row[3]?.trim() || null,
    brand_name: row[4]?.trim() || null,
    name: row[4]?.trim() || row[3]?.trim() || code, // brand_name || company_name || code
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
```

- [ ] **Step 2: 커밋**

```bash
git add lib/sheets/parsers.ts
git commit -m "feat: add Google Sheets row parsing utilities"
```

---

## Task 4: sync-projects.mjs 재작성

**Files:**
- Modify: `scripts/sync-projects.mjs` (전면 재작성)

- [ ] **Step 1: Notion SDK → Google Sheets API로 교체**

핵심 변경:
- `@notionhq/client` import 제거
- `googleapis`의 `google.auth.GoogleAuth` + `google.sheets` 사용
- `GOOGLE_SERVICE_ACCOUNT_JSON` 파일 읽어 JWT 인증
- `sheets.spreadsheets.values.get` 호출 (range: `시트1!A:AI`, `valueRenderOption: 'FORMATTED_VALUE'`)
- `values.slice(1)`로 헤더 스킵
- `parseSheetRow` 로직 인라인 (ESM에서 TS import 불가하므로 parsers.ts의 함수를 JS로 복사)
- **`batchUpsert` 함수 내 `onConflict: 'notion_id'` → `onConflict: 'row_code'`로 변경 필수**
- Notion property extractor 함수 전부 삭제
- 환율, Slack 알림, 네트워크 대기, 재시도 로직 유지

환경변수 체크 변경:
```javascript
const REQUIRED_ENV = [
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SHEETS_PROJECT_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]
```

Google Sheets 인증:
```javascript
import { google } from 'googleapis'
import { readFileSync } from 'fs'

const credentials = JSON.parse(readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'utf8'))
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})
const sheets = google.sheets({ version: 'v4', auth })
```

데이터 읽기:
```javascript
const { data } = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_PROJECT_ID,
  range: '시트1!A:AI',
  valueRenderOption: 'FORMATTED_VALUE',
})
const rows = (data.values ?? []).slice(1) // 헤더 스킵
```

- [ ] **Step 2: 로컬 테스트**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
node scripts/sync-projects.mjs
```

기대 출력: `[sync-projects] 202건 동기화 완료`

- [ ] **Step 3: Supabase에서 데이터 확인**

```sql
SELECT count(*) FROM projects;
SELECT row_code, company_name, brand_name, status, contract_krw, margin_krw FROM projects LIMIT 5;
```

- [ ] **Step 4: 커밋**

```bash
git add scripts/sync-projects.mjs
git commit -m "feat: switch sync-projects from Notion to Google Sheets"
```

---

## Task 5: calculations.ts 업데이트

**Files:**
- Modify: `lib/dashboard/calculations.ts`

- [ ] **Step 1: Project 인터페이스 교체**

기존 인터페이스 전체를 새 버전으로 교체. 핵심 변경:
- `notion_id` → `row_code`
- `parent_notion_id`, `team`, `priority` 등 삭제
- `name` 유지 (queries.ts에서 조합)
- `expense_krw/jpy`, `margin_krw/jpy`, `company_name`, `media` 등 추가

```typescript
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
  assignee_names: string[]
  assignee_sub: string[]
  start_date: string | null
  end_date: string | null
  note: string | null
  contract_krw: number
  contract_jpy: number
  collab_fee: number
  expense_krw: number
  expense_jpy: number
  margin_krw: number
  margin_jpy: number
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
```

- [ ] **Step 2: 계산 함수 교체**

```typescript
export function totalContractKrw(p: Project, jpyRate: number): number {
  return p.contract_krw + p.contract_jpy * jpyRate
}

export function totalExpenseKrw(p: Project, jpyRate: number): number {
  return p.expense_krw + p.expense_jpy * jpyRate
}

export function totalMarginKrw(p: Project, jpyRate: number): number {
  return p.margin_krw + p.margin_jpy * jpyRate
}

export function marginRate(p: Project, jpyRate: number): number {
  const contract = totalContractKrw(p, jpyRate)
  if (contract === 0) return 0
  return (totalMarginKrw(p, jpyRate) / contract) * 100
}

export function receivableKrw(p: Project, jpyRate: number): number {
  if (p.payment_status?.includes('잔금 입금 완료')) return 0
  return totalContractKrw(p, jpyRate)
}

export function projectDurationDays(p: Project): number | null {
  if (!p.start_date || !p.end_date) return null
  const start = new Date(p.start_date).getTime()
  const end = new Date(p.end_date).getTime()
  const diffMs = end - start
  if (isNaN(diffMs) || diffMs < 0) return null
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
```

삭제: `totalAdvanceKrw`, `totalCreatorSettlementKrw`, `marginKrw` (→ `totalMarginKrw`)

- [ ] **Step 3: 커밋**

```bash
git add lib/dashboard/calculations.ts
git commit -m "feat: update Project interface and calculations for sheets data"
```

---

## Task 6: queries.ts 업데이트

**Files:**
- Modify: `lib/dashboard/queries.ts`

- [ ] **Step 1: fetchAllProjects 필드 매핑 업데이트**

`name` 조합 로직 추가: `brand_name || company_name || row_code`

```typescript
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
  assignee_names: Array.isArray(row.assignee_names) ? row.assignee_names : [],
  assignee_sub: Array.isArray(row.assignee_sub) ? row.assignee_sub : [],
  start_date: row.start_date ?? null,
  end_date: row.end_date ?? null,
  note: row.note ?? null,
  contract_krw: Number(row.contract_krw ?? 0),
  contract_jpy: Number(row.contract_jpy ?? 0),
  collab_fee: Number(row.collab_fee ?? 0),
  expense_krw: Number(row.expense_krw ?? 0),
  expense_jpy: Number(row.expense_jpy ?? 0),
  margin_krw: Number(row.margin_krw ?? 0),
  margin_jpy: Number(row.margin_jpy ?? 0),
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
```

- [ ] **Step 2: fetchLatestExchangeRate 수정**

현재 코드의 `.single()` → `.maybeSingle()`로 변경 필수 (테이블 빈 경우 crash 방지).
칼럼명도 `jpy_to_krw` / `recorded_at` → `rate` / `rate_date` + `currency_pair` 필터 추가 (sync 스크립트와 통일):

```typescript
const { data, error } = await supabase
  .from('exchange_rates')
  .select('rate')
  .eq('currency_pair', 'JPY/KRW')
  .order('rate_date', { ascending: false })
  .limit(1)
  .maybeSingle()

if (error || !data) return FALLBACK_RATE
const rate = Number(data.rate)
return isNaN(rate) || rate <= 0 ? FALLBACK_RATE : rate
```

- [ ] **Step 3: 커밋**

```bash
git add lib/dashboard/queries.ts
git commit -m "feat: update queries for sheets-based project schema"
```

---

## Task 7: API 라우트 재작성

**Files:**
- Modify: `app/api/sync/projects/route.ts`

- [ ] **Step 1: Notion → Sheets 로직으로 교체**

핵심 변경:
- Notion import 전부 제거
- `googleapis` import + 서비스 계정 인증
- Sheets API로 `시트1!A:AI` 읽기 (`valueRenderOption: 'FORMATTED_VALUE'`)
- `parseSheetRow` 유틸리티 사용 (`lib/sheets/parsers.ts`에서 import)
- upsert `onConflict: 'row_code'`
- 환경변수 체크: `NOTION_PROJECT_DB_ID` → `GOOGLE_SHEETS_PROJECT_ID`

```typescript
import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { parseSheetRow } from '@/lib/sheets/parsers'
```

주의: Vercel 배포 시 `readFileSync`로 credentials 파일 읽기 불가 → 환경변수로 JSON 문자열 직접 전달하는 방식으로 변경 필요:

```typescript
// 로컬: 파일 경로, Vercel: JSON 문자열
const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.startsWith('{')
  ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  : readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!, 'utf8')
const credentials = JSON.parse(credentialsJson)
```

- [ ] **Step 2: 커밋**

```bash
git add app/api/sync/projects/route.ts
git commit -m "feat: rewrite project sync API route for Google Sheets"
```

---

## Task 8: 프론트엔드 업데이트 — 대시보드 메인

**Files:**
- Modify: `app/admin/projects/page.tsx`

- [ ] **Step 1: getSubProjects 제거 + 계산 함수 변경**

변경 목록:
- `getSubProjects()` 삭제 → `projects` 직접 사용 (모든 `sub` 변수를 `projects`로)
- import에서 `totalCreatorSettlementKrw` → `totalExpenseKrw`, `marginKrw` → `totalMarginKrw`
- **118행 `marginProjects` 필터: `totalCreatorSettlementKrw(p, rate)` → `totalExpenseKrw(p, rate)`**
- **122행: `marginKrw(p, rate)` → `totalMarginKrw(p, rate)`**
- `ACTIVE_STATUSES`에 시트의 새 상태값 추가: `'섭외 중'`
- `NON_ACTIVE_STATUSES`에 `'진행 전'` 추가 (시트에서 "시작 전" 대신 "진행 전" 사용)
- "Notion 동기화" → "시트 동기화" 텍스트 변경

- [ ] **Step 2: 커밋**

```bash
git add app/admin/projects/page.tsx
git commit -m "feat: update dashboard main page for sheets data"
```

---

## Task 9: 프론트엔드 업데이트 — 상세 뷰

**Files:**
- Modify: `app/admin/projects/detail/page.tsx`

- [ ] **Step 1: getSubProjects 제거 + 브랜드/프로젝트명 표시 정리**

모든 View 컴포넌트에서 `getSubProjects(projects)` → `projects` 직접 사용.

브랜드/프로젝트명 표시 변경:
- 기존: "브랜드" 칼럼 = `p.brand_name` (상위 항목), "프로젝트명" = `p.name` (Notion 제목)
- 변경: "법인명" 칼럼 = `p.company_name`, "브랜드" 칼럼 = `p.brand_name` (E열)
- `p.name`은 `brand_name || company_name || row_code`로 조합되므로, `brand_name`이 있으면 중복 표시됨
- **해결**: "브랜드" 칼럼 헤더를 "법인명"으로 변경하고 `p.company_name` 표시. "프로젝트명"은 `p.name` (= brand_name 우선) 유지.

- [ ] **Step 2: ReceivableView 수정**

- "선금" 칼럼 → "입금상태" (`payment_status` 텍스트 표시)
- `totalAdvanceKrw(p, rate)` 호출 제거
- `client_settlement` → `payment_status`
- import에서 `totalAdvanceKrw` 제거

- [ ] **Step 3: MarginView 수정**

- "크리에이터 정산" 칼럼 → "지출액(섭외비)"
- `totalCreatorSettlementKrw` → `totalExpenseKrw`
- `marginKrw` → `totalMarginKrw`
- import 변경

- [ ] **Step 4: 커밋**

```bash
git add app/admin/projects/detail/page.tsx
git commit -m "feat: update detail views for sheets data schema"
```

---

## Task 10: 미사용 컴포넌트 삭제

**Files:**
- Delete: `components/admin/dashboard/project-table.tsx`

- [ ] **Step 1: ProjectTable 컴포넌트 삭제**

이 컴포넌트는 현재 어느 페이지에서도 import하지 않는 미사용 파일. 삭제된 필드(`priority`, `client_settlement`, `tax_invoice_status`)를 참조하므로 빌드 에러 방지를 위해 삭제.

```bash
rm components/admin/dashboard/project-table.tsx
```

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "chore: remove unused ProjectTable component"
```

---

## Task 11: Vercel 환경변수 설정

- [ ] **Step 1: Vercel Dashboard에 환경변수 추가**

Vercel Dashboard → Settings → Environment Variables:
- `GOOGLE_SERVICE_ACCOUNT_JSON`: credentials.json의 **내용**(JSON 문자열)을 통째로 붙여넣기 (파일 경로가 아님!)
- `GOOGLE_SHEETS_PROJECT_ID`: `1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4`

(Leo님 수동 작업)

---

## Task 12: E2E 검증

- [ ] **Step 1: sync 스크립트 실행**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
node scripts/sync-projects.mjs
```

기대: `[sync-projects] XXX건 동기화 완료`

- [ ] **Step 2: dev 서버 실행 + 대시보드 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/admin/projects` 접속:
- KPI 카드 5종 숫자 표시 확인
- 차트 렌더링 확인
- "시트 동기화" 버튼 클릭 → 동기화 성공 메시지

- [ ] **Step 3: 상세 뷰 확인**

각 KPI 카드 클릭 → detail 페이지:
- 총 프로젝트: 전체 행 표시, `p.name` 표시 정상
- 미수금: "입금상태" 칼럼 표시, 금액 정상
- 마진: "지출액(섭외비)" 칼럼 표시, 마진율 정상

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "chore: cleanup and verify sheets datasource migration"
```
