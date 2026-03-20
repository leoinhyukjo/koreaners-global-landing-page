# 프로젝트 대시보드 데이터소스 전환: Notion → Google Sheets

## 개요

프로젝트 마스터 대시보드의 데이터소스를 Notion 프로젝트보드에서 Google Sheets "MKT Ops Master"로 전환한다. 기존 파이프라인(sync script → Supabase → 대시보드)을 유지하되, 데이터 수집 레이어만 교체한다.

## 데이터소스

- **시트**: `MKT Ops Master (수정 중)` (ID: `1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4`)
- **탭**: 시트1 (202행, 35열)
- **인증**: GCP 서비스 계정 (`claude@root-unison-487006-k8.iam.gserviceaccount.com`)
- **credentials**: `/Users/leo/Downloads/Claude-Projects/work-scripts/scripts/credentials.json`

## 데이터 흐름

```
Google Sheets (시트1)
  ↓ googleapis (서비스 계정, sheets.spreadsheets.values.get)
  ↓   valueRenderOption: 'FORMATTED_VALUE' (날짜/숫자를 시트 표시 형식 그대로 반환)
  ↓ 10분 폴링 (launchd, 기존 com.krns.sync-projects 재활용)
sync-projects.mjs (헤더행 스킵 → 행 파싱 + 금액 정제 + 환율 환산)
  ↓ batch upsert (row_code 기준)
Supabase projects 테이블
  ↓ 클라이언트 쿼리
어드민 대시보드
```

## 시트 칼럼 → Supabase 필드 매핑

| 인덱스 | 시트 헤더 | Supabase 필드 | 타입 | 파싱 규칙 |
|--------|----------|--------------|------|----------|
| A (0) | 구분-날짜 | `entry_date` | date | `2026-03-16 월` → `2026-03-16` |
| B (1) | 구분-날짜(Y-W) | `week_code` | text | 그대로 (`2026-12W`) |
| C (2) | 코드 | `row_code` | text, UNIQUE | PK 역할 (`2026-12W/방문건/밭 주식회사`) |
| D (3) | 법인명 | `company_name` | text | 그대로 |
| E (4) | 브랜드명 | `brand_name` | text | 그대로 |
| F (5) | 운영-status | `status` | text | 그대로 |
| G (6) | 구분 | `project_type` | text | 단건/방문건/공구/기프팅 등 |
| H (7) | 매체 | `media` | text | IG reels, YT 등 |
| I (8) | 운영 시트 | - | - | 스킵 (링크) |
| J (9) | 담당자-정 | `assignee_names` | text[] | 쉼표 split (`소희, 유지` → `['소희','유지']`) |
| K (10) | 담당자-부 | `assignee_sub` | text[] | 쉼표 split, 별도 저장 |
| L (11) | 시작일 | `start_date` | date | `2026. 1. 1` / `2026.01.31` → ISO date |
| M (12) | 종료일 | `end_date` | date | 동일 파싱 |
| N (13) | 비고 | `note` | text | 그대로 |
| O (14) | (빈 열) | - | - | 스킵 |
| P (15) | 계약 금액/원 | `contract_krw` | numeric | `₩17,878,863` → `17878863` |
| Q (16) | 계약 금액/엔 | `contract_jpy` | numeric | `¥600,000` → `600000` |
| R (17) | 콜라보 수수료 | `collab_fee` | numeric | 숫자 파싱 |
| S (18) | 지출액/원(섭외비) | `expense_krw` | numeric | 쉼표 제거 → 숫자 |
| T (19) | 지출액/엔(섭외비) | `expense_jpy` | numeric | 쉼표 제거 → 숫자 |
| U (20) | 원 마진 | `margin_krw` | numeric | 쉼표 제거 → 숫자 |
| V (21) | 엔 마진 | `margin_jpy` | numeric | 쉼표 제거 → 숫자 |
| W (22) | (빈 열) | - | - | 스킵 |
| X (23) | 견적서 | `estimate_status` | text | 그대로 (스킵/전달 완료 등) |
| Y (24) | 계약서 | `contract_status` | text | 그대로 (계약 완료 등) |
| Z (25) | 계약일자 | `contract_date` | date | 날짜 파싱 |
| AA (26) | 정산예정일 | `settlement_due_date` | date | 날짜 파싱 |
| AB (27) | 선금 정산일 | `advance_paid_date` | date | 날짜 파싱 |
| AC (28) | 잔금 정산일 | `balance_paid_date` | date | 날짜 파싱 |
| AD (29) | 계약 금액(원가) | `contract_cost` | numeric | 숫자 파싱 |
| AE (30) | 세금계산서 발행일 | `tax_invoice_date` | date | 날짜 파싱 |
| AF (31) | 입금 여부 | `payment_status` | text | 그대로 (`잔금 입금 완료` 등) |
| AG (32) | 송금 여부 | `remittance_status` | text | 그대로 |
| AH (33) | (빈 열) | - | - | 스킵 |
| AI (34) | 섭외 정산 | `creator_settlement_note` | text | 그대로 |

## 파싱 규칙

### Sheets API 호출
`valueRenderOption: 'FORMATTED_VALUE'` 필수. 이 옵션 없이 호출하면 날짜가 시리얼 숫자(예: `45000`)로 반환된다.

### 헤더 행 스킵
`values[0]`은 헤더 → `values.slice(1)`로 데이터 행만 처리.

### 빈 행 스킵
C열(코드)이 빈 문자열이면 해당 행 건너뛴다.

### 금액 파싱
```
₩17,878,863 → 17878863
¥600,000 → 600000
11,600,000 → 11600000
빈 문자열 / 0 → 0
```
`₩`, `¥`, `\\`, `,` 제거 후 `parseFloat`. NaN이면 0.

### 날짜 파싱
```
2026. 1. 1 → 2026-01-01
2026.01.31 → 2026-01-31
2026/01/31 → 2026-01-31
빈 문자열 → null
```
정규식: `/(\d{4})[.\s/]+(\d{1,2})[.\s/]+(\d{1,2})/` (슬래시 형식도 처리)

### 날짜(A열) 파싱
```
2026-03-16 월 → 2026-03-16
```
공백 앞 날짜 부분만 추출: `str.split(' ')[0]`

### 담당자 파싱
```
소희, 유지 → ['소희', '유지']
소희 → ['소희']
빈 문자열 → []
```
쉼표 split + trim + 빈 문자열 필터.

## 계산 로직 변경 (calculations.ts)

### Project 인터페이스
```typescript
interface Project {
  id: string
  row_code: string
  name: string              // = brand_name || company_name (표시용)
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

`name` 필드는 Supabase에 저장하지 않고 `queries.ts`에서 조합:
```
name = brand_name || company_name || row_code
```
기존 프론트엔드의 `p.name` 참조를 모두 유지하기 위함.

### 계산 함수
```
totalContractKrw(p, rate) = contract_krw + contract_jpy × rate
totalExpenseKrw(p, rate) = expense_krw + expense_jpy × rate
totalMarginKrw(p, rate) = margin_krw + margin_jpy × rate
marginRate(p, rate) = totalMarginKrw / totalContractKrw × 100
receivableKrw(p, rate) = payment_status에 "잔금 입금 완료" 포함 ? 0 : totalContractKrw
```

삭제되는 함수:
- `totalAdvanceKrw` — 시트에 선금 금액 없음
- `totalCreatorSettlementKrw` — `totalExpenseKrw`로 대체

## Supabase 마이그레이션

### 전략: TRUNCATE + 재생성

기존 612건(Notion 기반)을 전부 삭제하고 시트 202건으로 재삽입한다.
이유: 스키마 변경이 크고(PK 교체, 다수 칼럼 삭제/추가), Notion 데이터와 시트 데이터 간 매핑이 불가능.

### 롤백 방안
마이그레이션 전 `pg_dump` 또는 Supabase Dashboard에서 CSV export로 백업.
문제 발생 시 백업에서 복원 + sync-projects.mjs를 Notion 버전으로 되돌림.

### DDL 변경
```sql
-- 1. 백업 (Supabase SQL Editor에서 실행)
CREATE TABLE projects_backup AS SELECT * FROM projects;

-- 2. 기존 데이터 삭제
TRUNCATE projects;

-- 3. 기존 칼럼 삭제
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

-- 4. 신규 칼럼 추가
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

참고: `project_type`은 기존에 `text[]`로 존재 → DROP 후 `text`로 재생성.

## 프론트엔드 변경

### calculations.ts
- Project 인터페이스 교체 (위 명세)
- `totalAdvanceKrw` 삭제
- `totalCreatorSettlementKrw` → `totalExpenseKrw`로 이름 변경 (expense_krw/jpy 사용)
- `marginKrw` → `totalMarginKrw`로 변경 (시트의 원마진+엔마진×환율)
- `receivableKrw` 변경: `payment_status`에 "잔금 입금 완료" 포함 여부로 판정

### queries.ts
- 필드 매핑 업데이트 (새 칼럼명 반영)
- `name` 필드 조합: `brand_name || company_name || row_code`
- `fetchLatestExchangeRate` 수정: 현재 `jpy_to_krw`/`recorded_at` 칼럼을 참조하지만, sync 스크립트는 `rate`/`fetched_at`로 저장. 칼럼명을 sync 스크립트 기준(`rate`, `fetched_at`)으로 통일.

### projects/page.tsx
- `getSubProjects()` 삭제 → 전체 행 사용 (상위/하위 구조 제거)
- `totalCreatorSettlementKrw` → `totalExpenseKrw` 호출로 변경
- `marginKrw` → `totalMarginKrw` 호출로 변경
- KPI 계산: 새 계산 함수 사용
- "Notion 동기화" → "시트 동기화" 텍스트 변경

### projects/detail/page.tsx
- `getSubProjects()` 삭제 → 전체 행 사용
- ReceivableView: "선금" 칼럼 → "입금상태" 칼럼으로 변경 (`payment_status` 텍스트 표시)
- ReceivableView: `totalAdvanceKrw` 호출 제거
- ReceivableView: `client_settlement` → `payment_status`로 변경
- MarginView: "크리에이터 정산" 칼럼 → "지출액(섭외비)" 칼럼으로 변경 (`totalExpenseKrw` 사용)
- MarginView: `totalCreatorSettlementKrw` → `totalExpenseKrw`
- 모든 View의 `p.name` 참조는 queries.ts에서 조합되므로 변경 불필요

### components/admin/dashboard/project-table.tsx
- "우선순위" 칼럼 삭제 (`priority` 필드 없음)
- "세금계산서" 칼럼: `tax_invoice_status` → `tax_invoice_date` (날짜 표시 또는 유무 표시)
- "정산상태" 칼럼: `client_settlement` → `payment_status`
- 정렬: `priorityRank` 삭제, `entry_date` 또는 `start_date` 기준 정렬로 변경

## sync-projects.mjs 변경

- `@notionhq/client` import 제거 → `googleapis` 추가
- 서비스 계정 인증으로 Sheets API 호출
- `sheets.spreadsheets.values.get` 호출 시 `valueRenderOption: 'FORMATTED_VALUE'` 명시
- 헤더 행 스킵 (`values.slice(1)`)
- C열 빈 행 스킵
- 행별 파싱 (위 파싱 규칙 적용)
- 환율 로직 유지 (ECOS API + Supabase 캐시)
- batch upsert `row_code` 기준
- Slack 알림, 네트워크 대기, 재시도 로직 유지
- Notion property extractor 함수 전부 삭제

## API 라우트

- `POST /api/sync/projects` — 기존 유지, 내부 로직만 Sheets 호출로 변경

## 환경변수

기존 (프로젝트 동기화에서 제거, 다른 곳에서 사용 중이면 유지):
- `NOTION_TOKEN` — 프로젝트 동기화에서는 불필요
- `NOTION_PROJECT_DB_ID` — 제거

신규:
- `GOOGLE_SERVICE_ACCOUNT_JSON` — credentials.json 경로 (이미 blog-analytics에서 사용 중)
- `GOOGLE_SHEETS_PROJECT_ID` — 시트 ID (`1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4`)

## 범위 외

- 시트2 (인플루언서 퍼포먼스) 연동
- 시트 쓰기 (대시보드 → 시트 역방향)
- Notion 프로젝트보드 동기화 코드 완전 제거 (일단 비활성화만)
