# Project Master Dashboard - Design Spec

## Overview

Notion 전사 Project Board 데이터를 Supabase에 동기화하고, 코리너스 랜딩 어드민(`/admin/dashboard/`) 내에 3개 대시보드를 구축한다.

- **경영 대시보드**: 전사 현황, 매출, 미수금 조망
- **팀원 대시보드**: 담당자별 프로젝트 + 체크리스트
- **보고용 대시보드**: 브랜드별/담당자별 현황 + 트렌드

## Tech Stack

- **프론트엔드**: Next.js (기존 코리너스 랜딩) + recharts (이미 설치됨) + 기존 UI 컴포넌트 (Card, Badge, Table 등)
- **백엔드**: Next.js API Routes
- **DB**: Supabase (기존 `koreaners_global` 프로젝트)
- **데이터 소스**: Notion 전사 Project Board (`2f501ca3e48080849f3ad97dea794d47`)
- **환율 API**: 한국은행 ECOS API (JPY→KRW, 일 1회 캐싱, 환경변수: `BOK_ECOS_API_KEY`)
- **자동화**: launchd 10분 폴링 + 어드민 수동 동기화 버튼

## 1. Data Architecture

### 1.1 Supabase `projects` 테이블

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_notion_id text,          -- 상위 항목 (브랜드)
  brand_name text,                -- 상위 항목의 프로젝트 이름 (역정규화)
  status text,                    -- 시작 전/보류/진행 중/검토 중/리스트업 중/리스트 전달/인플루언서 섭외/클라이언트 정산 중/인플루언서 정산 중/완료/Drop
  priority text,                  -- 🔥TODAY/높음/보통/낮음
  team text[],                    -- BizOps/S&O/BD/MKT/CC/SALES
  project_type text[],            -- 단건/체험단/팝업·매장방문/방문건/공구
  assignee_names text[],          -- 담당자 이름 (Notion person → 이름 변환)
  contract_krw numeric DEFAULT 0, -- 계약금액 KRW (VAT 제외)
  contract_jpy numeric DEFAULT 0, -- 계약금액 JPY (VAT 제외)
  advance_payment_krw numeric DEFAULT 0, -- 선금 입금액 KRW
  advance_payment_jpy numeric DEFAULT 0, -- 선금 입금액 JPY
  creator_settlement_krw numeric DEFAULT 0, -- 크리에이터 정산금액 KRW
  creator_settlement_jpy numeric DEFAULT 0, -- 크리에이터 정산금액 JPY
  client_settlement text,         -- 선금 입금 완료/입금 완료/입금 전
  creator_settlement_status text, -- 입금 완료/부분 입금/입금 전
  contract_status text,           -- 전달 예정/전달 완료/초안 검토 중/계약 완료/스킵
  estimate_status text,           -- 전달 완료/전달 전/스킵
  tax_invoice_status text,        -- 발행 전/발행 완료/스킵
  start_date date,
  end_date date,
  note text,
  influencer_info text,
  settlement_progress text,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_parent ON projects(parent_notion_id);
CREATE INDEX idx_projects_assignee ON projects USING GIN(assignee_names);
CREATE INDEX idx_projects_team ON projects USING GIN(team);
```

### 1.2 Supabase `exchange_rates` 테이블

```sql
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair text NOT NULL,     -- 'JPY_KRW'
  rate numeric NOT NULL,
  rate_date date NOT NULL,         -- 환율 기준일 (영업일)
  source text DEFAULT 'BOK_ECOS',  -- 한국은행 ECOS
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(currency_pair, rate_date)
);
```

### 1.3 미수금 계산 로직

```
환율 = exchange_rates에서 JPY_KRW 당일 최신값

총 계약금액(KRW) = contract_krw + (contract_jpy × 환율)
총 선금(KRW)     = advance_payment_krw + (advance_payment_jpy × 환율)
미수금           = 총 계약금액 - 총 선금  (client_settlement != '입금 완료' 인 경우만)
```

- `client_settlement = '입금 완료'`인 프로젝트는 미수금 0으로 처리
- `client_settlement`가 NULL인 경우 → '입금 전'과 동일하게 미수금으로 간주
- 환율이 없는 날(주말/공휴일)은 가장 최근 영업일 환율 사용 (`ORDER BY rate_date DESC LIMIT 1`)

## 2. Sync System

### 2.1 동기화 엔드포인트

`POST /api/sync/projects`

기존 크리에이터/포트폴리오/블로그 동기화와 동일한 패턴:

1. Notion API로 전사 Project Board 전체 페이지 fetch
2. 담당자(person) → Notion API person 속성의 `name` 필드 사용 (별도 Users API 호출 불필요)
3. 상위 항목(relation) → 상위 페이지의 notion_id + 이름 추출 (1차 fetch 결과에서 매핑)
4. Supabase `notion_id` 기준 upsert
5. Notion에서 삭제/Drop된 프로젝트는 Supabase에서 삭제하지 않음 (status로 관리)
6. 동기화 결과 반환 (생성/수정 수)

### 2.2 환율 동기화

동기화 시 당일 환율 체크:
- `exchange_rates`에 당일 레코드 있음 → 캐시 사용
- 없음 → 한국은행 ECOS API 호출 (`StatisticSearch/731Y001`, JPY 매매기준율)
- 주말/공휴일 등 API 응답 없음 → 가장 최근 레코드 사용

### 2.3 자동화

- **launchd**: 10분 폴링 (`com.krns.sync-projects`)
  - plist 경로: `~/Library/LaunchAgents/com.krns.sync-projects.plist`
  - 기존 동기화 plist(`com.krns.sync-creators` 등)와 동일한 패턴
  - `SYNC_SECRET` 환경변수로 API 인증 (기존 동기화와 동일)
- **어드민 버튼**: 기존 동기화 버튼 3개 옆에 "프로젝트 동기화" 버튼 추가

## 3. Dashboard UI

### 3.1 라우팅

```
/admin/                     → 기존 어드민 페이지 (동기화 버튼 등, 그대로 유지)
/admin/dashboard/           → 경영 대시보드 (기본)
/admin/dashboard/team       → 팀원 대시보드
/admin/dashboard/report     → 보고용 대시보드
```

기존 `/admin/` 페이지는 그대로 유지하고, `/admin/dashboard/`를 새로 추가한다.
기존 어드민 인증(Supabase Auth, layout.tsx 세션 체크)이 자동 적용된다.

### 3.2 UI 라이브러리

**recharts** (이미 설치됨) + **기존 UI 컴포넌트** (Card, Badge, Table 등)
- 차트: recharts의 BarChart, PieChart, LineChart, ResponsiveContainer
- KPI 카드, 테이블, 뱃지: 기존 `components/ui/` 컴포넌트 활용
- Tremor 미사용 (Tailwind 4와 호환 이슈)

### 3.3 경영 대시보드 (`/admin/dashboard/`)

**상단 KPI 카드 4개** (한 줄):
- 총 프로젝트 수
- 진행 중 프로젝트 수
- 총 계약금액 (KRW 환산)
- 미수금 합계

**중단 2칼럼**:
- 좌: 상태별 파이프라인 (가로 바 차트, 11단계)
- 우: 팀별 프로젝트 수 + 금액 (도넛 차트)

**하단 2칼럼**:
- 좌: 월별 계약금액 추이 (라인 차트, 시작일 기준 최근 6개월, 계약금액 KRW 환산 합계)
- 우: 미수금 TOP 10 프로젝트 리스트 (금액 내림차순)

### 3.4 팀원 대시보드 (`/admin/dashboard/team`)

**필터**: 담당자 드롭다운 (전체/개인별 수동 선택)

**상단 KPI 카드 3개**:
- 내 프로젝트 수
- 우선순위 높음/TODAY 수
- 내 미수금 합계

**메인 테이블**: 담당 프로젝트 목록
- 칼럼: 프로젝트명, 브랜드, 상태, 우선순위, 계약서/견적서/세금계산서 (아이콘 뱃지), 정산상태, 금액
- 상태별 컬러 뱃지
- 우선순위순 정렬 (기본)

### 3.5 보고용 대시보드 (`/admin/dashboard/report`)

**상단 요약 카드 4개**:
- 전체 계약금액 (KRW 환산)
- 미수금
- 완료 프로젝트 수
- 평균 프로젝트 기간 (일)

**중단**: 브랜드별 프로젝트 현황 테이블
- 상위 항목(브랜드) 기준 그룹핑
- 하위 프로젝트 수, 총 계약금액, 정산 현황 요약
- 접기/펼치기 (accordion)

**하단 2칼럼**:
- 좌: 담당자별 업무량 (바 차트, 프로젝트 수 기준)
- 우: 월간 트렌드 (라인 차트, 신규 vs 완료 프로젝트 수)

### 3.6 공통

- 데스크탑 우선, 모바일은 카드 세로 스택
- 대시보드 간 탭 네비게이션

## 4. Key Decisions

| 결정 | 선택 | 이유 |
|------|------|------|
| 데이터 경유 | Notion → Supabase 직행 | Google Sheets 경유 불필요 |
| 프로젝트 위치 | 코리너스 랜딩 `/admin` 확장 | 기존 인증/인프라 재활용 |
| UI 라이브러리 | recharts + 기존 UI 컴포넌트 | 이미 설치됨, Tailwind 4 호환, 추가 의존성 없음 |
| 환율 API | 한국은행 ECOS | 공신력 (중앙은행), 무료 일 10만건 |
| 동기화 | 자동 10분 폴링 + 수동 버튼 | 기존 동기화 패턴과 동일 |
| 담당자 필터 | 드롭다운 수동 선택 | 매핑 테이블 불필요, 내부 도구로 충분 |

## 5. Out of Scope

- 대시보드에서 Notion 데이터 직접 수정 (읽기 전용)
- 역할/권한 기반 접근 제어 (전 직원 동일 접근)
- 실시간 환율 (일 1회 캐싱으로 충분)
- PDF/Excel 리포트 내보내기 (추후 필요 시 추가)
