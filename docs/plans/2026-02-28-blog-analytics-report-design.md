# Blog Analytics Report Design

**Goal:** GA4 + Search Console 데이터를 주간 수집하여 Notion Blog DB 속성 갱신 + 별도 주간 리포트 DB 히스토리 축적

**Approach:** 독립 Python 스크립트 + launchd (기존 meta-ads-reporter 동일 패턴)

---

## Architecture

```
[GA4 Data API] ──┐
                  ├──▶ slug 기준 병합 ──▶ Notion
[GSC API] ───────┘                       ├─ Blog DB 속성 갱신 (최신 주간 수치)
                                         └─ 주간 리포트 DB 히스토리 축적
```

- **인증:** 단일 Google 서비스 계정 JSON (GA4 + GSC 스코프 합산)
- **스케줄:** launchd 매주 수요일 10:00 (GSC 데이터 2~3일 지연 고려)
- **모니터링:** Healthchecks.io start/success/fail 3단계 ping

## Data Sources

### GA4 (트래픽)
| 지표 | API 필드 | 설명 |
|------|----------|------|
| 페이지뷰 | `screenPageViews` | 조회수 |
| 세션 | `sessions` | 방문 수 |
| 평균 체류시간 | `averageSessionDuration` | 초 단위 |
| 활성 사용자 | `activeUsers` | 순 방문자 |

### Search Console (검색 성과)
| 지표 | API 필드 | 설명 |
|------|----------|------|
| 클릭수 | `clicks` | 검색 결과에서 클릭 |
| 노출수 | `impressions` | 검색 결과 노출 |
| CTR | `ctr` | 클릭률 (0~1) |
| 평균 순위 | `position` | 검색 결과 평균 위치 |

## Notion Data Structure

### A. Blog DB 속성 추가 (포스트별 최신 주간 스냅샷)
- `주간 PV` (number)
- `주간 클릭` (number)
- `주간 노출` (number)
- `평균 CTR` (number, %)
- `평균 순위` (number)
- `주간 체류시간` (number, 초)
- `리포트 갱신일` (date)

### B. 주간 리포트 DB (히스토리)
- `리포트 기간` (title) — "2026-W09 (02/24~03/02)"
- `포스트` (relation → Blog DB)
- `PV` / `세션` / `사용자` / `체류시간` (number)
- `클릭` / `노출` / `CTR` / `평균순위` (number)
- `생성일` (date)

## File Structure

```
blog-analytics-reporter/
├── report.py              # 메인 스크립트 (ETL + Notion)
├── .env                   # GA4_PROPERTY_ID, GSC_SITE_URL, NOTION_TOKEN 등
├── .env.example
├── requirements.txt
└── README.md
```

단일 파일 구조 — 데이터 소스 2개 + Notion 쓰기뿐이라 모듈 분리 불필요.

## Error Handling
- Healthchecks.io start/success/fail 3단계 ping
- API 재시도 3회 (60초 간격)
- 서비스 계정 권한 누락 시 명확한 에러 메시지 + fail ping
