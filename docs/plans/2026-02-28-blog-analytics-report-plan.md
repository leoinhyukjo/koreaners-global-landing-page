# Blog Analytics Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** GA4 + Search Console 데이터를 주간 수집하여 Notion Blog DB 속성 갱신 + 별도 주간 리포트 DB 히스토리 축적하는 Python 스크립트 구축

**Architecture:** 독립 Python 스크립트(report.py)가 GA4 Data API와 Search Console API에서 /blog/* 경로 데이터를 수집하고, slug 기준으로 병합한 뒤 Notion Blog DB 속성 업데이트 + 주간 리포트 DB에 히스토리 레코드를 생성한다. launchd로 매주 수요일 10:00 자동 실행.

**Tech Stack:** Python 3, google-analytics-data, google-api-python-client, google-auth, notion-client==2.2.1, python-dotenv

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `scripts/blog-analytics-reporter/report.py`
- Create: `scripts/blog-analytics-reporter/.env.example`
- Create: `scripts/blog-analytics-reporter/requirements.txt`
- Create: `scripts/blog-analytics-reporter/.gitignore`

**Step 1: 디렉토리 생성 및 requirements.txt 작성**

```bash
mkdir -p scripts/blog-analytics-reporter
```

`scripts/blog-analytics-reporter/requirements.txt`:
```
# Google APIs
google-analytics-data>=0.18.0
google-api-python-client>=2.100.0
google-auth>=2.23.0

# Notion API
notion-client==2.2.1

# Environment
python-dotenv==1.0.0
```

**Step 2: .env.example 작성**

`scripts/blog-analytics-reporter/.env.example`:
```
# Google Service Account
GOOGLE_SERVICE_ACCOUNT_JSON="/path/to/service-account.json"

# GA4
GA4_PROPERTY_ID="123456789"

# Google Search Console
GSC_SITE_URL="https://www.koreaners.co/"

# Notion
NOTION_TOKEN="ntn_your_integration_token"
NOTION_BLOG_DB_ID="2f501ca3e4808082aae4f046911ccf9b"
NOTION_REPORT_DB_ID=""

# Monitoring (Optional)
HEALTHCHECK_PING_URL=""
```

**Step 3: .gitignore 작성**

`scripts/blog-analytics-reporter/.gitignore`:
```
.env
*.json
!.env.example
__pycache__/
```

**Step 4: report.py 스켈레톤 작성**

`scripts/blog-analytics-reporter/report.py`:
```python
#!/usr/bin/env python3
"""
Blog Analytics Weekly Reporter

GA4 + Search Console → Notion Blog DB 속성 갱신 + 주간 리포트 DB 히스토리

Usage:
    python report.py
    python report.py --dry-run   # Notion 쓰기 없이 데이터만 확인

Requirements:
    pip install -r requirements.txt
    Google 서비스 계정에 GA4 뷰어 + Search Console 사용자 권한 필요
"""

from __future__ import annotations

import os
import sys
import urllib.request
import traceback
from pathlib import Path

# ── Early healthcheck (stdlib only) ──────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
_dotenv_path = SCRIPT_DIR / ".env"
if _dotenv_path.is_file():
    with open(_dotenv_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if not _line or _line.startswith("#") or "=" not in _line:
                continue
            _key, _, _val = _line.partition("=")
            _key = _key.strip()
            _val = _val.strip().strip('"').strip("'")
            if _key and _key not in os.environ:
                os.environ[_key] = _val


def _ping_healthcheck(status: str = "success", body: str = "") -> None:
    url = os.environ.get("HEALTHCHECK_PING_URL", "")
    if not url:
        return
    try:
        suffix = {"fail": "/fail", "start": "/start"}.get(status, "")
        req = urllib.request.Request(
            url + suffix, data=body.encode()[:10_000] if body else None
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[WARN] Healthcheck ping failed: {e}")


# ── Imports (after healthcheck setup) ────────────────────────
import argparse
import logging
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv(SCRIPT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(SCRIPT_DIR / "report.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="데이터 확인만, Notion 쓰기 안 함")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("Blog Analytics Weekly Report 시작")
    log.info("=" * 60)

    # 1. 환경 변수 검증
    validate_env()

    # 2. 날짜 범위 계산 (지난 월~일)
    start_date, end_date = get_week_range()
    log.info(f"리포트 기간: {start_date} ~ {end_date}")

    # 3. GA4 데이터 수집
    ga_data = fetch_ga4_data(start_date, end_date)
    log.info(f"GA4: {len(ga_data)}개 페이지 수집")

    # 4. Search Console 데이터 수집
    gsc_data = fetch_gsc_data(start_date, end_date)
    log.info(f"GSC: {len(gsc_data)}개 페이지 수집")

    # 5. slug 기준 병합
    merged = merge_data(ga_data, gsc_data)
    log.info(f"병합 결과: {len(merged)}개 포스트")

    # 6. 결과 출력
    for slug, data in sorted(merged.items(), key=lambda x: x[1].get("pageviews", 0), reverse=True):
        log.info(
            f"  {slug}: PV={data.get('pageviews', 0)}, "
            f"clicks={data.get('clicks', 0)}, "
            f"impressions={data.get('impressions', 0)}, "
            f"CTR={data.get('ctr', 0):.1%}, "
            f"pos={data.get('position', 0):.1f}"
        )

    if args.dry_run:
        log.info("--dry-run 모드: Notion 업데이트 건너뜀")
        return

    # 7. Notion Blog DB 속성 업데이트
    updated = update_blog_db(merged, start_date, end_date)
    log.info(f"Blog DB 업데이트: {updated}개 포스트")

    # 8. Notion 주간 리포트 DB 히스토리 생성
    created = create_weekly_report(merged, start_date, end_date)
    log.info(f"주간 리포트 생성: {created}개 레코드")

    log.info("=" * 60)
    log.info("✅ Blog Analytics Report 완료!")
    log.info("=" * 60)


if __name__ == "__main__":
    _ping_healthcheck("start")
    try:
        main()
        _ping_healthcheck("success")
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[FATAL] {e}\n{tb}")
        _ping_healthcheck("fail", f"{e}\n{tb}")
        sys.exit(1)
```

**Step 5: 의존성 설치**

Run: `cd scripts/blog-analytics-reporter && pip install -r requirements.txt`

**Step 6: Commit**

```bash
git add scripts/blog-analytics-reporter/
git commit -m "chore: scaffold blog analytics reporter"
```

---

## Task 2: 환경 변수 검증 + 날짜 범위 계산

**Files:**
- Modify: `scripts/blog-analytics-reporter/report.py`

**Step 1: validate_env() 구현**

report.py에 추가:
```python
REQUIRED_ENV = [
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    "GA4_PROPERTY_ID",
    "GSC_SITE_URL",
    "NOTION_TOKEN",
    "NOTION_BLOG_DB_ID",
]


def validate_env() -> None:
    """필수 환경 변수 존재 확인."""
    missing = [k for k in REQUIRED_ENV if not os.getenv(k)]
    if missing:
        raise EnvironmentError(f"Missing env vars: {', '.join(missing)}")

    # 서비스 계정 파일 존재 확인
    sa_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if not Path(sa_path).is_file():
        raise FileNotFoundError(f"Service account file not found: {sa_path}")

    log.info("환경 변수 검증 완료")
```

**Step 2: get_week_range() 구현**

```python
def get_week_range() -> tuple[str, str]:
    """지난 주 월~일 날짜 범위 반환 (YYYY-MM-DD)."""
    today = datetime.now()
    # 지난 주 일요일
    days_since_monday = today.weekday()
    last_sunday = today - timedelta(days=days_since_monday + 1)
    last_monday = last_sunday - timedelta(days=6)
    return last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d")
```

**Step 3: 테스트 실행**

Run: `cd scripts/blog-analytics-reporter && python -c "from report import get_week_range; print(get_week_range())"`
Expected: 지난 주 월~일 날짜 출력 (예: `('2026-02-23', '2026-03-01')`)

**Step 4: Commit**

```bash
git add scripts/blog-analytics-reporter/report.py
git commit -m "feat: add env validation and date range calculation"
```

---

## Task 3: GA4 데이터 수집

**Files:**
- Modify: `scripts/blog-analytics-reporter/report.py`

**Step 1: Google 인증 헬퍼 구현**

```python
from google.oauth2 import service_account

SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
]


def get_google_credentials() -> service_account.Credentials:
    """Google 서비스 계정 인증 정보 로드."""
    sa_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    return service_account.Credentials.from_service_account_file(sa_path, scopes=SCOPES)
```

**Step 2: fetch_ga4_data() 구현**

```python
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    RunReportRequest,
)


def fetch_ga4_data(start_date: str, end_date: str) -> dict[str, dict]:
    """GA4에서 /blog/* 페이지 트래픽 데이터 수집.

    Returns:
        {slug: {pageviews, sessions, avg_duration, users}}
    """
    credentials = get_google_credentials()
    client = BetaAnalyticsDataClient(credentials=credentials)
    property_id = os.getenv("GA4_PROPERTY_ID", "")

    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name="pagePath")],
        metrics=[
            Metric(name="screenPageViews"),
            Metric(name="sessions"),
            Metric(name="averageSessionDuration"),
            Metric(name="activeUsers"),
        ],
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="pagePath",
                string_filter=Filter.StringFilter(
                    match_type=Filter.StringFilter.MatchType.BEGINS_WITH,
                    value="/blog/",
                ),
            )
        ),
        limit=10000,
    )

    response = client.run_report(request)
    result: dict[str, dict] = {}

    for row in response.rows:
        page_path = row.dimension_values[0].value  # e.g. "/blog/some-slug"
        slug = page_path.replace("/blog/", "").strip("/")
        if not slug or slug == "blog":
            continue

        result[slug] = {
            "pageviews": int(row.metric_values[0].value),
            "sessions": int(row.metric_values[1].value),
            "avg_duration": float(row.metric_values[2].value),
            "users": int(row.metric_values[3].value),
        }

    return result
```

**Step 3: 수동 테스트**

Run: `cd scripts/blog-analytics-reporter && python -c "
from report import *
validate_env()
start, end = get_week_range()
data = fetch_ga4_data(start, end)
print(data)
"`
Expected: `/blog/*` 경로의 GA4 데이터 딕셔너리 출력

**Step 4: Commit**

```bash
git add scripts/blog-analytics-reporter/report.py
git commit -m "feat: GA4 data collection for blog pages"
```

---

## Task 4: Search Console 데이터 수집

**Files:**
- Modify: `scripts/blog-analytics-reporter/report.py`

**Step 1: fetch_gsc_data() 구현**

```python
from googleapiclient.discovery import build


def fetch_gsc_data(start_date: str, end_date: str) -> dict[str, dict]:
    """Search Console에서 /blog/* 검색 성과 수집.

    Returns:
        {slug: {clicks, impressions, ctr, position}}
    """
    credentials = get_google_credentials()
    service = build("searchconsole", "v1", credentials=credentials)
    site_url = os.getenv("GSC_SITE_URL", "")

    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["page"],
        "type": "web",
        "rowLimit": 25000,
        "dataState": "all",
    }

    response = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    result: dict[str, dict] = {}

    for row in response.get("rows", []):
        page_url: str = row["keys"][0]  # full URL

        # /blog/ 경로만 필터 + slug 추출
        if "/blog/" not in page_url:
            continue
        slug = page_url.split("/blog/")[-1].strip("/")
        if not slug:
            continue

        result[slug] = {
            "clicks": int(row["clicks"]),
            "impressions": int(row["impressions"]),
            "ctr": float(row["ctr"]),
            "position": float(row["position"]),
        }

    return result
```

**Step 2: 수동 테스트**

Run: `cd scripts/blog-analytics-reporter && python -c "
from report import *
validate_env()
start, end = get_week_range()
data = fetch_gsc_data(start, end)
print(data)
"`
Expected: `/blog/*` 경로의 GSC 데이터 딕셔너리 출력

**Step 3: Commit**

```bash
git add scripts/blog-analytics-reporter/report.py
git commit -m "feat: Search Console data collection for blog pages"
```

---

## Task 5: 데이터 병합

**Files:**
- Modify: `scripts/blog-analytics-reporter/report.py`

**Step 1: merge_data() 구현**

```python
def merge_data(ga_data: dict[str, dict], gsc_data: dict[str, dict]) -> dict[str, dict]:
    """GA4 + GSC 데이터를 slug 기준으로 병합.

    Returns:
        {slug: {pageviews, sessions, avg_duration, users, clicks, impressions, ctr, position}}
    """
    all_slugs = set(ga_data.keys()) | set(gsc_data.keys())
    merged: dict[str, dict] = {}

    for slug in all_slugs:
        ga = ga_data.get(slug, {})
        gsc = gsc_data.get(slug, {})
        merged[slug] = {
            "pageviews": ga.get("pageviews", 0),
            "sessions": ga.get("sessions", 0),
            "avg_duration": ga.get("avg_duration", 0.0),
            "users": ga.get("users", 0),
            "clicks": gsc.get("clicks", 0),
            "impressions": gsc.get("impressions", 0),
            "ctr": gsc.get("ctr", 0.0),
            "position": gsc.get("position", 0.0),
        }

    return merged
```

**Step 2: Commit**

```bash
git add scripts/blog-analytics-reporter/report.py
git commit -m "feat: merge GA4 and GSC data by slug"
```

---

## Task 6: Notion Blog DB 속성 업데이트

**Files:**
- Modify: `scripts/blog-analytics-reporter/report.py`

**Context:** Notion Blog DB ID는 `2f501ca3e4808082aae4f046911ccf9b`. 속성 `슬러그`(rich_text)로 포스트를 매칭한다. 새 속성 7개를 추가해야 한다 (주간 PV, 주간 클릭, 주간 노출, 평균 CTR, 평균 순위, 주간 체류시간, 리포트 갱신일).

**Step 1: Notion 클라이언트 + Blog DB 업데이트 구현**

```python
from notion_client import Client as NotionClient


def get_notion_client() -> NotionClient:
    return NotionClient(auth=os.getenv("NOTION_TOKEN"))


def update_blog_db(merged: dict[str, dict], start_date: str, end_date: str) -> int:
    """Notion Blog DB의 각 포스트 속성을 최신 주간 수치로 업데이트.

    Returns:
        업데이트된 포스트 수
    """
    notion = get_notion_client()
    db_id = os.getenv("NOTION_BLOG_DB_ID", "")
    updated = 0

    # Blog DB 전체 페이지 조회 (slug 매핑)
    pages = query_all_pages(notion, db_id)
    slug_to_page: dict[str, str] = {}

    for page in pages:
        props = page.get("properties", {})
        slug_prop = props.get("슬러그", {})
        if slug_prop.get("type") == "rich_text":
            texts = slug_prop.get("rich_text", [])
            slug = "".join(t.get("plain_text", "") for t in texts)
            if slug:
                slug_to_page[slug] = page["id"]

    # 각 포스트 업데이트
    for slug, data in merged.items():
        page_id = slug_to_page.get(slug)
        if not page_id:
            log.warning(f"Blog DB에서 slug '{slug}' 못 찾음 — 건너뜀")
            continue

        try:
            notion.pages.update(
                page_id=page_id,
                properties={
                    "주간 PV": {"number": data["pageviews"]},
                    "주간 클릭": {"number": data["clicks"]},
                    "주간 노출": {"number": data["impressions"]},
                    "평균 CTR": {"number": round(data["ctr"] * 100, 1)},
                    "평균 순위": {"number": round(data["position"], 1)},
                    "주간 체류시간": {"number": round(data["avg_duration"], 1)},
                    "리포트 갱신일": {"date": {"start": end_date}},
                },
            )
            updated += 1
            log.info(f"  Blog DB 업데이트: {slug}")
        except Exception as e:
            log.error(f"  Blog DB 업데이트 실패 ({slug}): {e}")

    return updated


def query_all_pages(notion: NotionClient, db_id: str) -> list[dict]:
    """Notion DB 전체 페이지 조회 (페이지네이션 처리)."""
    pages: list[dict] = []
    cursor = None

    while True:
        kwargs: dict = {"database_id": db_id, "page_size": 100}
        if cursor:
            kwargs["start_cursor"] = cursor

        response = notion.databases.query(**kwargs)
        pages.extend(response.get("results", []))

        if not response.get("has_more"):
            break
        cursor = response.get("next_cursor")

    return pages
```

**Step 2: 수동 테스트 (dry-run으로 먼저 확인 후)**

Run: `cd scripts/blog-analytics-reporter && python report.py --dry-run`
Expected: GA4/GSC 데이터 수집 + 병합 결과 출력, Notion 쓰기 없음

**Step 3: Notion Blog DB에 속성 7개 수동 추가**

Notion 웹에서 Blog DB (`2f501ca3e4808082aae4f046911ccf9b`)에 아래 속성 추가:
- `주간 PV` (숫자)
- `주간 클릭` (숫자)
- `주간 노출` (숫자)
- `평균 CTR` (숫자)
- `평균 순위` (숫자)
- `주간 체류시간` (숫자)
- `리포트 갱신일` (날짜)

**Step 4: 실제 실행 테스트**

Run: `cd scripts/blog-analytics-reporter && python report.py`
Expected: Blog DB 속성 업데이트 확인

**Step 5: Commit**

```bash
git add scripts/blog-analytics-reporter/report.py
git commit -m "feat: update Notion Blog DB with weekly analytics"
```

---

## Task 7: Notion 주간 리포트 DB 생성 + 히스토리 기록

**Files:**
- Modify: `scripts/blog-analytics-reporter/report.py`

**Context:** 주간 리포트 DB를 스크립트에서 자동 생성하거나, 수동으로 Notion에서 만든 뒤 ID를 .env에 넣는다. 수동 생성이 더 안전하고 간단.

**Step 1: 주간 리포트 DB 수동 생성**

Notion 웹에서 Blog DB 옆에 새 DB 생성:
- DB 이름: `블로그 주간 리포트`
- 속성:
  - `리포트 기간` (title)
  - `포스트 슬러그` (텍스트)
  - `PV` (숫자)
  - `세션` (숫자)
  - `사용자` (숫자)
  - `체류시간` (숫자)
  - `클릭` (숫자)
  - `노출` (숫자)
  - `CTR` (숫자)
  - `평균순위` (숫자)
  - `생성일` (날짜)

생성 후 DB ID를 `.env`의 `NOTION_REPORT_DB_ID`에 입력.

**Step 2: create_weekly_report() 구현**

```python
def create_weekly_report(merged: dict[str, dict], start_date: str, end_date: str) -> int:
    """Notion 주간 리포트 DB에 포스트별 히스토리 레코드 생성.

    Returns:
        생성된 레코드 수
    """
    report_db_id = os.getenv("NOTION_REPORT_DB_ID", "")
    if not report_db_id:
        log.warning("NOTION_REPORT_DB_ID 미설정 — 주간 리포트 건너뜀")
        return 0

    notion = get_notion_client()
    created = 0

    # ISO week 번호 계산
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    iso_year, iso_week, _ = start_dt.isocalendar()
    period_label = f"{iso_year}-W{iso_week:02d} ({start_date[5:]}~{end_date[5:]})"

    for slug, data in merged.items():
        # 데이터가 전부 0이면 건너뜀
        if data["pageviews"] == 0 and data["clicks"] == 0:
            continue

        try:
            notion.pages.create(
                parent={"database_id": report_db_id},
                properties={
                    "리포트 기간": {"title": [{"text": {"content": period_label}}]},
                    "포스트 슬러그": {"rich_text": [{"text": {"content": slug}}]},
                    "PV": {"number": data["pageviews"]},
                    "세션": {"number": data["sessions"]},
                    "사용자": {"number": data["users"]},
                    "체류시간": {"number": round(data["avg_duration"], 1)},
                    "클릭": {"number": data["clicks"]},
                    "노출": {"number": data["impressions"]},
                    "CTR": {"number": round(data["ctr"] * 100, 1)},
                    "평균순위": {"number": round(data["position"], 1)},
                    "생성일": {"date": {"start": datetime.now().strftime("%Y-%m-%d")}},
                },
            )
            created += 1
        except Exception as e:
            log.error(f"  리포트 생성 실패 ({slug}): {e}")

    return created
```

**Step 3: 전체 실행 테스트**

Run: `cd scripts/blog-analytics-reporter && python report.py`
Expected: Blog DB 업데이트 + 주간 리포트 DB에 레코드 생성 확인

**Step 4: Commit**

```bash
git add scripts/blog-analytics-reporter/report.py
git commit -m "feat: create weekly report history in Notion"
```

---

## Task 8: launchd 스케줄 등록 + Healthchecks.io 설정

**Files:**
- Create: `~/Library/LaunchAgents/com.krns.blog-analytics.plist`
- Modify: `scripts/blog-analytics-reporter/.env` (HEALTHCHECK_PING_URL 추가)

**Step 1: Healthchecks.io 체크 생성**

Healthchecks.io 대시보드에서 새 체크 생성:
- Name: `Blog Analytics Reporter`
- Period: 7 days
- Grace: 1 day

생성된 ping URL을 `.env`의 `HEALTHCHECK_PING_URL`에 입력.

**Step 2: launchd plist 작성**

`~/Library/LaunchAgents/com.krns.blog-analytics.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.krns.blog-analytics</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/python3</string>
        <string>/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/blog-analytics-reporter/report.py</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>3</integer>
        <key>Hour</key>
        <integer>10</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/leo/logs/blog-analytics.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/leo/logs/blog-analytics.log</string>
    <key>WorkingDirectory</key>
    <string>/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/blog-analytics-reporter</string>
</dict>
</plist>
```

**Step 3: plist 로드**

Run: `launchctl load ~/Library/LaunchAgents/com.krns.blog-analytics.plist`

**Step 4: 수동 실행으로 전체 파이프라인 검증**

Run: `cd scripts/blog-analytics-reporter && python report.py`
Expected: GA4 + GSC 수집 → 병합 → Blog DB 업데이트 → 주간 리포트 생성 → Healthcheck ping

**Step 5: Commit**

```bash
git add scripts/blog-analytics-reporter/
git commit -m "feat: blog analytics reporter complete with launchd schedule"
```
