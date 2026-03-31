# 캠페인 성과 플라이휠 설계

> 일하면서 데이터가 자동으로 쌓이고, 정기 리뷰를 통해 개선점이 도출되는 구조

## 문제 정의

1. 캠페인 성과 데이터가 PM 개인 시트/고객사 리포트(PPT/PDF)에 산재 — 내부 분석/축적 불가
2. 캠페인 종료 후 구조화된 회고가 없음 — 개선점 도출 안 됨
3. 사업 전체를 조망하는 정기 리뷰 데이터/대시보드 부재
4. PM에게 추가 업무를 줄 수 없음

## 핵심 원칙

- **PM 추가 작업: 제로** — 기존 워크플로우에서 자동 수집
- **데이터는 자동으로 쌓인다** — 일하면 쌓이는 구조
- **리뷰는 자동으로 생성된다** — 숫자 나열이 아니라 인사이트 + 액션아이템
- **기존 인프라 재활용** — Supabase, 어드민 대시보드, launchd, Notion, Slack

## 데이터 소스

### 1. PM 고객사 시트 (공유 드라이브)

- **위치**: Google Drive 공유 드라이브 `156iQRzAbzaFD9XXRHqArImSDrYbYn8SK` (MKT팀 폴더) 내 고객사별 시트
- **구조**: 시트마다 칼럼명/순서 다름. 공통 요소: 크리에이터명, IG 핸들, 콘텐츠 URL (업로드 링크)
- **수집 대상**: Instagram 콘텐츠 URL → Apify로 성과 지표(뷰, 좋아요, 공유, 댓글) 자동 수집

### 2. MKT Ops Master 시트

- **ID**: `1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4`
- **Dashboard 탭** (42칼럼, 1037행): 캠페인 재무/운영 데이터
  - 법인명, 브랜드명, 구분(단건/방문건), 매체, 담당자, 시작일/종료일
  - 계약 금액(원/엔/USD), 지출액(섭외비), 마진
  - 운영-status, 정산 상태, 견적서/계약서
- **insight 탭**: 크리에이터 성과 데이터 적재 대상
  - 칼럼: 날짜, 인플루언서닉네임, 카테고리, 브랜드명, 유형, 뷰, 좋아요, 공유, 댓글

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│              PM 작업 변화: 없음                    │
│  (고객사 시트에 크리에이터+URL 기록 = 기존과 동일)    │
└─────────────────────────────────────────────────┘
                      │
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
   [공유 드라이브]  [MKT Ops Master]  [MKT Ops Master]
    PM 고객사 시트   Dashboard 탭      운영-status
    (콘텐츠 URL)    (재무 데이터)      (상태 변경)
          │           │               │
          ▼           ▼               │
   ┌────────────┐ ┌──────────┐       │
   │URL 자동 추출│ │재무 동기화 │       │
   │+ Apify 수집 │ │→Supabase │       │
   │→insight 탭  │ └──────────┘       │
   │→Supabase   │       │            │
   └────────────┘       │            │
     주 2회 (화/금)    주 2회          │
          │             │            │
          ▼             ▼            ▼
   ┌──────────────────────────────────────┐
   │          Supabase 중앙 DB            │
   │  campaign_posts + campaign_financials │
   └──────────────────────────────────────┘
          │              │            │
          ▼              ▼            ▼
   ┌──────────┐  ┌────────────┐  ┌──────────┐
   │ 어드민    │  │ 캠페인 회고 │  │ 정기 리뷰 │
   │ 대시보드  │  │ "진행 완료" │  │ 격주 월AM │
   │ 인사이트탭│  │ 시 자동생성 │  │ 자동생성  │
   └──────────┘  └────────────┘  └──────────┘
                       │              │
                       ▼              ▼
                  Notion + Slack 알림
```

## Supabase 스키마

### campaign_posts (콘텐츠 단위)

| 칼럼 | 타입 | 소스 |
|------|------|------|
| id | uuid PK | 자동 |
| created_at | timestamptz | 자동 |
| brand_name | text | PM 시트에서 추출 |
| creator_name | text | PM 시트에서 추출 |
| ig_handle | text | PM 시트에서 추출 |
| post_url | text UNIQUE | PM 시트에서 추출 |
| post_type | text | URL 패턴 자동 판별 (reels/feed/story) |
| views | integer | Apify 수집 |
| likes | integer | Apify 수집 |
| shares | integer | Apify 수집 |
| comments | integer | Apify 수집 |
| collected_at | timestamptz | Apify 수집 시점 |
| source_sheet_id | text | 추적용 (어느 시트에서 왔는지) |
| campaign_code | text | Dashboard 탭 코드와 매칭 |

### campaign_financials (캠페인 단위)

| 칼럼 | 타입 | 소스 |
|------|------|------|
| id | uuid PK | 자동 |
| campaign_code | text UNIQUE | Dashboard 코드 |
| company_name | text | Dashboard 법인명 |
| brand_name | text | Dashboard 브랜드명 |
| campaign_type | text | Dashboard 구분 (단건/방문건) |
| media | text | Dashboard 매체 |
| contract_amount_krw | numeric | Dashboard |
| contract_amount_jpy | numeric | Dashboard |
| contract_amount_usd | numeric | Dashboard |
| cost_krw | numeric | Dashboard 지출액/원 |
| cost_jpy | numeric | Dashboard 지출액/엔 |
| margin_krw | numeric | Dashboard 마진 |
| status | text | Dashboard 운영-status |
| start_date | date | Dashboard |
| end_date | date | Dashboard |
| pm_primary | text | Dashboard 담당자-정 |
| pm_secondary | text | Dashboard 담당자-부 |
| synced_at | timestamptz | 마지막 동기화 시점 |

### campaign_reviews (리뷰 기록)

| 칼럼 | 타입 | 소스 |
|------|------|------|
| id | uuid PK | 자동 |
| created_at | timestamptz | 자동 |
| review_type | text | completion / periodic |
| period_start | date | 리뷰 대상 기간 시작 |
| period_end | date | 리뷰 대상 기간 끝 |
| campaign_code | text (nullable) | 캠페인 회고 시 |
| insights_json | jsonb | Claude 분석 결과 |
| action_items | text[] | 도출된 액션아이템 |
| notion_page_id | text | Notion 연동 |

**조인 전략**: `campaign_posts.campaign_code` ↔ `campaign_financials.campaign_code` 가 1순위. campaign_code 매칭 불가 시 `brand_name` + 기간 겹침으로 fallback. campaign_code는 Dashboard 탭의 코드 칼럼 (예: `2026-12W/방문건/밭 주식회사/감자밭`)에서 추출하며, PM 시트 파일명의 브랜드명으로 역매칭.

## 자동화 컴포넌트 (신규 3개)

### 1. Sheet Scanner + Apify Collector

- **스케줄**: launchd 주 2회 (화/금 10:00)
- **동작**:
  1. Google Drive API로 공유 드라이브 폴더 내 시트 목록 조회
  2. 각 시트에서 Instagram URL 포함 칼럼 자동 탐지 (regex: `instagram.com/(reel|p)/`)
  3. 신규 URL 추출 (Supabase에 없는 것만)
  4. Apify Instagram Scraper로 성과 지표 수집
  5. MKT Ops Master insight 탭에 기록
  6. Supabase `campaign_posts` 테이블에 적재
- **기술**: Python + Google Sheets API + Apify API + Supabase client

### 2. Dashboard ETL

- **스케줄**: launchd 주 2회 (화/금 10:30, Sheet Scanner 이후)
- **동작**:
  1. MKT Ops Master Dashboard 탭 전체 읽기
  2. campaign_code 기준 upsert → Supabase `campaign_financials`
  3. `운영-status == "진행 완료"` 신규 감지 시 → Review Generator 트리거
- **기술**: Python + Google Sheets API + Supabase client

### 3. Review Generator

- **트리거 2종**:
  - **캠페인 완료 회고**: Dashboard ETL에서 "진행 완료" 신규 감지 시 즉시 실행
  - **정기 사업 리뷰**: launchd 격주 월요일 09:00
- **동작**:
  1. Supabase에서 대상 데이터 조회 (campaign_posts + campaign_financials JOIN)
  2. Claude API로 분석 + 인사이트 + 액션아이템 생성
  3. Notion 페이지 생성
  4. Slack 알림 발송
  5. Supabase `campaign_reviews` 기록
- **기술**: Python + Claude API + Notion MCP/API + Slack API

## 리뷰 리포트 구성

### 캠페인 완료 회고

1. **성과 요약** — 총 크리에이터 수, 총 조회수/좋아요, 평균 engagement rate
2. **비용 효율** — CPV(조회당 비용), CPE(engagement당 비용), 마진율
3. **Top/Bottom 크리에이터** — 성과 상위/하위 3명 + 이유 분석
4. **카테고리 인사이트** — 업종별 벤치마크 대비 성과
5. **다음 캠페인 제안** — 크리에이터 재기용 추천, 단가 조정 필요 여부

### 정기 사업 리뷰 (격주)

1. **파이프라인 현황** — 진행 중 캠페인 수, 총 계약액, 예상 마진
2. **기간 비교** — 이번 2주 vs 지난 2주 (매출, 마진, 캠페인 수)
3. **크리에이터 풀 헬스** — 가동률, 신규 투입 수, 재기용률
4. **브랜드 리텐션** — 재계약 브랜드 vs 이탈, 업종별 집중도
5. **액션아이템** — 데이터 기반 구체적 제안 3~5개

## 어드민 대시보드 확장

기존 `/admin` 대시보드에 **"캠페인 인사이트"** 탭 추가:

1. **캠페인 리스트** — 전체 캠페인 테이블, 필터(브랜드/상태/기간/담당자), 성과 요약 칼럼
2. **크리에이터 리포트** — 크리에이터별 누적 성과 (총 캠페인 수, 평균 CPV, engagement rate), 카테고리별 비교
3. **트렌드** — 월별 매출/마진 추이, 캠페인 유형별 ROI, 크리에이터 가동률 차트

## 구현 순서 (예상)

1. **Phase 1**: Supabase 스키마 + Dashboard ETL (재무 데이터부터 쌓기)
2. **Phase 2**: Sheet Scanner + Apify Collector (성과 데이터 자동 수집)
3. **Phase 3**: Review Generator (캠페인 회고 + 정기 리뷰)
4. **Phase 4**: 어드민 대시보드 인사이트 탭

## 외부 의존성

- **Apify**: Instagram Scraper actor — 가격은 사용량 기반 (소규모면 무료 티어 가능)
- **Google Drive/Sheets API**: 이미 사용 중 (GAS, 기존 자동화)
- **Claude API**: 리뷰 생성용 — 이미 사용 중
- **Supabase**: 이미 사용 중 (koreaners 랜딩)

## 성공 기준

1. 캠페인 종료 후 24시간 이내에 성과 데이터가 Supabase에 적재됨
2. "진행 완료" 전환 시 자동으로 캠페인 회고 리포트가 Notion에 생성됨
3. 격주 월요일에 사업 전체 리뷰 리포트가 Slack으로 옴
4. 어드민 대시보드에서 크리에이터별/브랜드별 누적 성과 조회 가능
5. PM 추가 업무: 제로
