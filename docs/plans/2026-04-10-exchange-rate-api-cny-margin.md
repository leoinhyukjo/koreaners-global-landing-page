# 환율 API 교체 + CNY 인프라 추가 + 마진 재계산

**작성일**: 2026-04-10
**상태**: 승인 대기 → 실행
**담당**: Leo / Oliver

---

## 배경

1. 어드민 대시보드의 프로젝트 계약금액/마진 수치가 **정확하지 않음**
   - 예시: 마녀공장 ¥1,200,000 계약이 `₩10,800,000` (실제 환율 적용시 `₩11,160,000` 근처여야 함)
2. 원인 파악
   - `lib/exchange-rate.ts`가 ECOS(한국은행) API 사용하는데 `BOK_ECOS_API_KEY`가 로컬/Vercel 모두 미등록 → 항상 **하드코딩 폴백값 `9.0`, `1350.0`** 사용
   - 시트의 `마진(원으로 적용)` 칼럼은 마케팅팀이 수동 계산한 값이라 부정확
   - 시트의 `환율` 칼럼(AG)도 일부만 입력돼있고 일관성 없음
   - 위안(CNY) 거래 지원 없음 (스키마/코드/시트 전부 누락)
3. 결정사항
   - 한국수출입은행 환율 API로 교체 (매매기준율, 무료, 즉시 발급)
   - 대시보드 마진을 **환율 기반 재계산**으로 전환 (시트 칼럼 무시)
   - 위안 인프라는 지금 추가해두고 시트 칼럼은 필요 시 후속 추가

---

## 요구사항

### Functional
- [x] JPY/USD/CNY 환율을 한국수출입은행 API(`exchangeJSON`)에서 조회
- [x] 매매기준율(`deal_bas_r`) 사용
- [x] JPY는 100엔 기준이므로 `/ 100` 처리
- [x] 당일 데이터 없을 시(주말/공휴일/11시 이전) 전 영업일로 롤백 (최대 7일)
- [x] Supabase `exchange_rates` 캐시 테이블 재사용 (`CNY/KRW` pair 추가)
- [x] `projects` 테이블에 `contract_cny`, `expense_cny` 칼럼 추가
- [x] `header-map.json`에 위안 매핑 추가 (시트에 해당 헤더 없으면 null 처리)
- [x] 대시보드 마진 공식 변경:
      `margin = totalContractKrw - totalExpenseKrw` (콜라보 수수료 제외)
- [x] 시트의 `margin_krw` 필드는 DB 싱크 유지(참조용), 대시보드 계산에는 미사용

### Non-functional
- API 실패 시 폴백 체인: 당일 캐시 → API 호출 → 최근 캐시 → 하드코딩 폴백
- 하드코딩 폴백값 최신화: JPY 9.3 / USD 1450 / CNY 200 (2026-04 기준 근사치)

---

## 작업 분할

### Step 1. DB 마이그레이션 (Supabase MCP 직접 실행)
```sql
ALTER TABLE projects
  ADD COLUMN contract_cny numeric DEFAULT 0 NOT NULL,
  ADD COLUMN expense_cny numeric DEFAULT 0 NOT NULL;
```
- 영향: 기존 612개 레코드에 기본값 0 채워짐
- 검증: `SELECT count(*) FROM projects WHERE contract_cny = 0` → 전체 건수와 일치

### Step 2. `lib/exchange-rate.ts` 재작성
- 변경사항
  - `ExchangeRates` 타입에 `cnyToKrw: number` 추가
  - `FALLBACK_*` 상수 최신화 (JPY 9.3, USD 1450, CNY 200)
  - `getRate()`/`fetchEcosRate()` 제거 → `fetchKoreaEximRates()` 단일 함수로 교체
  - 한 번의 API 호출로 3개 통화 모두 추출 (배열에서 `JPY(100)`, `USD`, `CNH` 필터)
  - `JPY(100)` → `deal_bas_r / 100`
  - `CNH` → `deal_bas_r` (1위안 기준)
  - 영업일 롤백: 오늘 날짜로 호출 → `result` ≠ 1 이거나 빈 배열이면 하루 전으로 재시도 (최대 7일)
  - 날짜별 3통화 한 번에 upsert
- env 교체: `BOK_ECOS_API_KEY` 레퍼런스 제거 → `KOREA_EXIM_API_KEY`
- 하위 호환: `getJpyToKrwRate()`는 유지 (legacy caller 있을 수 있음)

### Step 3. `lib/sheets/header-map.json` CNY 매핑 추가
```json
"계약 금액 / 위안 (부가세X)": { "field": "contract_cny", "type": "money" },
"지출액/위안(섭외비)": { "field": "expense_cny", "type": "money" }
```
- 시트에 해당 헤더 없으면 parseRowDynamic에서 자동으로 스킵 (영향 없음)

### Step 4. `lib/dashboard/calculations.ts` 업데이트
- `Project` 타입에 `contract_cny: number`, `expense_cny: number` 추가
- `totalContractKrw(p, rates)`:
  ```ts
  p.contract_krw
    + p.contract_jpy * rates.jpyToKrw
    + p.contract_usd * rates.usdToKrw
    + p.contract_cny * rates.cnyToKrw
  ```
- `totalExpenseKrw(p, rates)`:
  ```ts
  p.expense_krw
    + p.expense_jpy * rates.jpyToKrw
    + p.expense_cny * rates.cnyToKrw
  ```
  (지출엔 USD 칼럼 없음 — 시트 구조 확인 완료)
- **`totalMarginKrw` 시그니처 변경**:
  ```ts
  export function totalMarginKrw(p: Project, rates: ExchangeRates): number {
    return totalContractKrw(p, rates) - totalExpenseKrw(p, rates)
  }
  ```
- `marginRate(p, rates)`: 이미 rates 받고 있으므로 시그니처 유지, 내부 호출만 업데이트
- `p.margin_krw` 필드는 인터페이스에서 유지 (DB 싱크는 그대로)

### Step 5. `lib/dashboard/queries.ts` 업데이트
- `fetchAllProjects` 매핑에 `contract_cny`, `expense_cny` 추가

### Step 6. `app/api/sync/projects/route.ts` 검증
- 이미 `A:AL` 읽고 있어 범위 변경 불요
- `parseRowDynamic`이 동적으로 헤더 매핑하므로 header-map.json 업데이트만으로 CNY 자동 인식

### Step 7. 마진 사용처 전수 업데이트
- `grep -rn "totalMarginKrw\|margin_krw" app lib components` 로 전 참조 추출
- 시그니처 변경(rates 인자 추가) 대응:
  - 호출부가 이미 `rates`를 받을 수 있으면 그대로 전달
  - 없으면 상위로 전파하거나 `getExchangeRates()` 추가 호출
- 주요 추정 지점:
  - `app/admin/projects/**` (KPI, MarginView, 차트, 드릴다운)
  - `lib/dashboard/**` 내부 집계 함수들
  - `scripts/sync-projects.mjs` (로컬 싱크 스크립트는 영향 없음 — 계산 안 함)

### Step 8. env vars 등록
- **Leo님 제공 key**: `HDnzCqiPP4uYxdxsK7MqTQilDYWIH3uG`
- `.env.local`에 `KOREA_EXIM_API_KEY` 추가
- Vercel prod에 `vercel env add KOREA_EXIM_API_KEY production` 으로 추가
- 기존 `BOK_ECOS_API_KEY`는 Vercel에 없음 → 정리 불필요

### Step 9. 재배포 + 검증
- git push → Vercel 자동 배포
- production `/api/sync/projects` POST 호출해서 `exchangeRates`가 `{jpyToKrw: ~9.3, usdToKrw: ~1450, cnyToKrw: ~200}` 반환 확인
- 어드민 대시보드 접속해서 마녀공장 프로젝트 계약금액이 `₩10,800,000` → `₩11,1xx,xxx`로 변경됐는지 확인
- MarginView에서 몇 개 프로젝트 마진 수치가 시트의 `마진(원으로 적용)` 칼럼과 근사치인지 비교 (콜라보 수수료 포함된 프로젝트는 차이 발생 가능 — 정상)

---

## 리스크 및 완화

| 리스크 | 영향 | 완화 |
|---|---|---|
| 한국수출입은행 API가 주말/휴일에 당일 데이터 없음 | 첫 호출 실패 | 영업일 롤백 로직 (최대 7일) |
| API 일일 한도 1,000회 초과 | 환율 조회 실패 | Supabase 캐시로 당일은 1회만 API 호출 |
| CNY 칼럼 추가 후 기존 쿼리 타입 불일치 | 빌드 에러 | Step 4, 5에서 타입 동시 업데이트 |
| `totalMarginKrw(p)` 시그니처 변경으로 미처 못 찾은 호출부가 런타임 에러 | 대시보드 일부 망가짐 | Step 7에서 grep 전수 확인 + TypeScript 타입 체크 |
| 시트 마진값과 새 계산값 차이 → 팀 혼선 | 운영 이슈 | Leo님 사전 승인 완료, 필요 시 팀 공지 |
| 새 하드코딩 폴백값이 실제와 차이 | 폴백 시 정확도 저하 | 4월 초 환율 기준으로 현실값 입력 (JPY 9.3 / USD 1450 / CNY 200) |

---

## 완료 조건 (Definition of Done)

- [ ] DB 스키마에 `contract_cny`, `expense_cny` 존재
- [ ] `lib/exchange-rate.ts`가 한국수출입은행 API 호출해 실제 환율 반환
- [ ] `KOREA_EXIM_API_KEY` 로컬/Vercel prod 모두 등록
- [ ] production `/api/sync/projects` 호출 시 `exchangeRates.jpyToKrw`가 9.0이 아닌 실제 값 (예: 9.28)
- [ ] 어드민 대시보드 마진 수치가 새 공식으로 표기
- [ ] 마녀공장 계약금액이 실제 환율 기반으로 교정됨
- [ ] TypeScript 빌드 통과 (`npm run build` or Vercel 빌드 그린)
- [ ] 커밋 2개로 분리: `feat: 한국수출입은행 환율 API + CNY 인프라` / `refactor: 대시보드 마진 환율 기반 재계산`
