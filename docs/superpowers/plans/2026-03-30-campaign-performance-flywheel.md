# 캠페인 성과 플라이휠 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PM 추가 작업 없이 캠페인 성과 데이터를 자동 수집하고, 캠페인 완료 회고 + 격주 사업 리뷰를 자동 생성하는 플라이휠 구축

**Architecture:** MKT Ops Master 시트(재무) + PM 고객사 시트(콘텐츠 URL) → Apify(IG 성과 수집) → Supabase(중앙 DB) → Claude(리뷰 생성) → Notion + Slack. 기존 Python launchd 자동화 패턴, Supabase admin client, Next.js 어드민 대시보드를 재활용.

**Tech Stack:** Python 3.13, Google Sheets API, Apify API, Supabase (Python + TypeScript clients), Claude API (anthropic), Next.js 16 App Router, recharts, launchd

---

## File Map

### Python 자동화 (신규 프로젝트: `scripts/campaign-flywheel/`)

```
scripts/campaign-flywheel/
├── requirements.txt              # 의존성
├── .env.example                  # 환경변수 템플릿
├── config.py                     # 상수, 시트 ID, Apify 설정
├── sheets_client.py              # Google Sheets 읽기/쓰기
├── sheet_scanner.py              # 공유 드라이브 시트 스캔 + URL 추출
├── apify_collector.py            # Apify Instagram Scraper 호출
├── dashboard_etl.py              # Dashboard 탭 → Supabase campaign_financials
├── insight_writer.py             # 수집 결과 → insight 탭 + Supabase campaign_posts
├── review_generator.py           # Claude 분석 → 회고/정기 리포트 → Notion + Slack
├── run_collect.py                # 엔트리포인트: 수집 파이프라인 (화/금)
├── run_review.py                 # 엔트리포인트: 정기 리뷰 (격주 월)
├── tests/
│   ├── test_sheet_scanner.py
│   ├── test_apify_collector.py
│   ├── test_dashboard_etl.py
│   ├── test_insight_writer.py
│   └── test_review_generator.py
```

### Supabase 마이그레이션 (기존 경로)

```
supabase/
└── migrations/
    └── 20260330_campaign_flywheel.sql
```

### Next.js 어드민 대시보드 (기존 경로 확장)

```
app/admin/
├── page.tsx                                  # 수정: 인사이트 카드 추가
└── insights/
    ├── page.tsx                              # 캠페인 인사이트 메인
    └── components/
        ├── campaign-table.tsx                # 캠페인 리스트 + 필터
        ├── creator-report.tsx                # 크리에이터별 누적 성과
        └── trend-charts.tsx                  # 트렌드 차트

lib/dashboard/
├── queries.ts                                # 수정: 인사이트 쿼리 추가
└── calculations.ts                           # 수정: CPV, CPE 계산 추가

app/api/sync/
└── campaign-insights/route.ts                # 수동 동기화 트리거 API
```

### launchd plist (2개)

```
~/Library/LaunchAgents/
├── com.krns.campaign-collect.plist           # 화/금 10:00
└── com.krns.campaign-review.plist            # 격주 월 09:00
```

---

## Task 1: Supabase 스키마 생성

**Files:**
- Create: `supabase/migrations/20260330_campaign_flywheel.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- supabase/migrations/20260330_campaign_flywheel.sql

-- 1. campaign_posts: 크리에이터 콘텐츠 성과 (단위: 포스트)
CREATE TABLE IF NOT EXISTS campaign_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  brand_name text NOT NULL,
  creator_name text,
  ig_handle text,
  post_url text NOT NULL UNIQUE,
  post_type text, -- reels / feed / story
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments integer DEFAULT 0,
  collected_at timestamptz,
  source_sheet_id text,
  campaign_code text
);

CREATE INDEX idx_campaign_posts_brand ON campaign_posts(brand_name);
CREATE INDEX idx_campaign_posts_ig_handle ON campaign_posts(ig_handle);
CREATE INDEX idx_campaign_posts_campaign_code ON campaign_posts(campaign_code);
CREATE INDEX idx_campaign_posts_collected_at ON campaign_posts(collected_at DESC);

-- 2. campaign_financials: 캠페인 재무 데이터 (단위: 캠페인)
CREATE TABLE IF NOT EXISTS campaign_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_code text NOT NULL UNIQUE,
  company_name text,
  brand_name text NOT NULL,
  campaign_type text, -- 단건 / 방문건
  media text, -- IG reels 등
  contract_amount_krw numeric DEFAULT 0,
  contract_amount_jpy numeric DEFAULT 0,
  contract_amount_usd numeric DEFAULT 0,
  cost_krw numeric DEFAULT 0,
  cost_jpy numeric DEFAULT 0,
  margin_krw numeric DEFAULT 0,
  status text,
  start_date date,
  end_date date,
  pm_primary text,
  pm_secondary text,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_financials_brand ON campaign_financials(brand_name);
CREATE INDEX idx_campaign_financials_status ON campaign_financials(status);
CREATE INDEX idx_campaign_financials_start_date ON campaign_financials(start_date DESC);

-- 3. campaign_reviews: 리뷰 기록
CREATE TABLE IF NOT EXISTS campaign_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  review_type text NOT NULL, -- completion / periodic
  period_start date,
  period_end date,
  campaign_code text,
  insights_json jsonb,
  action_items text[],
  notion_page_id text
);

CREATE INDEX idx_campaign_reviews_type ON campaign_reviews(review_type);
CREATE INDEX idx_campaign_reviews_created ON campaign_reviews(created_at DESC);

-- RLS (기존 패턴: public read, admin write)
ALTER TABLE campaign_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_campaign_posts" ON campaign_posts FOR SELECT USING (true);
CREATE POLICY "service_write_campaign_posts" ON campaign_posts FOR ALL USING (true);

CREATE POLICY "public_read_campaign_financials" ON campaign_financials FOR SELECT USING (true);
CREATE POLICY "service_write_campaign_financials" ON campaign_financials FOR ALL USING (true);

CREATE POLICY "public_read_campaign_reviews" ON campaign_reviews FOR SELECT USING (true);
CREATE POLICY "service_write_campaign_reviews" ON campaign_reviews FOR ALL USING (true);
```

- [ ] **Step 2: Supabase 대시보드에서 마이그레이션 실행**

Run: Supabase SQL Editor에서 위 SQL 실행
Expected: 3개 테이블 + 인덱스 생성 완료

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add supabase/migrations/20260330_campaign_flywheel.sql
git commit -m "feat: add campaign flywheel schema (posts, financials, reviews)"
```

---

## Task 2: Python 프로젝트 세팅 + config

**Files:**
- Create: `scripts/campaign-flywheel/requirements.txt`
- Create: `scripts/campaign-flywheel/.env.example`
- Create: `scripts/campaign-flywheel/config.py`

- [ ] **Step 1: requirements.txt 작성**

```txt
google-api-python-client>=2.100.0
google-auth>=2.23.0
apify-client>=1.8.0
supabase>=2.0.0
anthropic>=0.40.0
notion-client==2.2.1
python-dotenv==1.0.0
```

- [ ] **Step 2: .env.example 작성**

```env
# Google
GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json

# Apify
APIFY_API_TOKEN=your-apify-token

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude
ANTHROPIC_API_KEY=your-anthropic-key

# Notion
NOTION_TOKEN=your-notion-token

# Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C09HY4065TM

# Sheets
MKT_OPS_MASTER_SHEET_ID=1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4
PM_SHARED_DRIVE_FOLDER_ID=156iQRzAbzaFD9XXRHqArImSDrYbYn8SK
```

- [ ] **Step 3: config.py 작성**

```python
"""캠페인 플라이휠 설정"""
from __future__ import annotations
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent

# MKT Ops Master 시트
MKT_OPS_MASTER_SHEET_ID = "1zVFBaBJ-5E9ieUkn5k7fL8ZGecenO1Af4vnDC-8_my4"
DASHBOARD_TAB = "Dashboard"
INSIGHT_TAB = "insight"

# PM 공유 드라이브 폴더
PM_SHARED_DRIVE_FOLDER_ID = "156iQRzAbzaFD9XXRHqArImSDrYbYn8SK"

# Dashboard 칼럼 인덱스 (0-based, Row 1 기준)
class DashboardCol:
    DATE = 0
    DATE_YW = 1
    CODE = 2
    COMPANY_NAME = 3
    BRAND_NAME = 4
    STATUS = 5
    CAMPAIGN_TYPE = 6
    MEDIA = 7
    OPERATION_SHEET = 8
    PM_PRIMARY = 9
    PM_SECONDARY = 10
    START_DATE = 11
    END_DATE = 12
    NOTE = 13
    # 14: empty
    CONTRACT_KRW = 15
    CONTRACT_JPY = 16
    CONTRACT_USD = 17
    COLLAB_FEE = 18
    COST_KRW = 19
    COST_JPY = 20
    MARGIN_KRW = 21

# Apify
APIFY_ACTOR_ID = "apify/instagram-post-scraper"
APIFY_MAX_ITEMS = 1  # URL당 1개 결과

# Instagram URL 패턴
IG_URL_PATTERN = r"https?://(?:www\.)?instagram\.com/(?:reel|p|stories)/[\w\-/]+"

# 리뷰
COMPLETION_STATUS = "진행 완료"
REVIEW_PERIODIC_DAYS = 14  # 격주

# 로그
LOG_DIR = Path.home() / "logs"
LOG_FILE = LOG_DIR / "campaign-flywheel.log"
```

- [ ] **Step 4: .env 파일 생성 (실제 값)**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/campaign-flywheel
cp .env.example .env
# 실제 키 채우기 — .env.shared에서 대부분 가져올 수 있음
```

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/requirements.txt scripts/campaign-flywheel/.env.example scripts/campaign-flywheel/config.py
git commit -m "feat: campaign flywheel project setup and config"
```

---

## Task 3: Google Sheets 클라이언트

**Files:**
- Create: `scripts/campaign-flywheel/sheets_client.py`
- Create: `scripts/campaign-flywheel/tests/test_sheets_client.py`

- [ ] **Step 1: 테스트 작성**

```python
# tests/test_sheets_client.py
"""sheets_client 단위 테스트 — Google API 모킹"""
from __future__ import annotations
import pytest
from unittest.mock import MagicMock, patch

from sheets_client import SheetsClient


@pytest.fixture
def mock_sheets_service():
    service = MagicMock()
    values = MagicMock()
    service.spreadsheets.return_value.values.return_value = values
    return service, values


def test_read_tab_returns_rows(mock_sheets_service):
    service, values = mock_sheets_service
    values.get.return_value.execute.return_value = {
        "values": [
            ["header1", "header2"],
            ["val1", "val2"],
        ]
    }
    with patch("sheets_client.build_sheets_service", return_value=service):
        client = SheetsClient()
        rows = client.read_tab("sheet_id", "Sheet1!A:Z")
    assert len(rows) == 2
    assert rows[0] == ["header1", "header2"]


def test_read_tab_empty_sheet(mock_sheets_service):
    service, values = mock_sheets_service
    values.get.return_value.execute.return_value = {}
    with patch("sheets_client.build_sheets_service", return_value=service):
        client = SheetsClient()
        rows = client.read_tab("sheet_id", "Sheet1!A:Z")
    assert rows == []


def test_append_rows(mock_sheets_service):
    service, values = mock_sheets_service
    values.append.return_value.execute.return_value = {"updates": {"updatedRows": 2}}
    with patch("sheets_client.build_sheets_service", return_value=service):
        client = SheetsClient()
        result = client.append_rows("sheet_id", "Sheet1", [["a", "b"], ["c", "d"]])
    assert result == 2


def test_list_drive_sheets():
    mock_drive = MagicMock()
    mock_drive.files.return_value.list.return_value.execute.return_value = {
        "files": [
            {"id": "abc", "name": "시트1"},
            {"id": "def", "name": "시트2"},
        ]
    }
    with patch("sheets_client.build_drive_service", return_value=mock_drive):
        client = SheetsClient()
        files = client.list_drive_sheets("folder_id")
    assert len(files) == 2
    assert files[0]["id"] == "abc"
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/campaign-flywheel
pip install -r requirements.txt pytest
python -m pytest tests/test_sheets_client.py -v
```
Expected: ModuleNotFoundError (sheets_client 없음)

- [ ] **Step 3: sheets_client.py 구현**

```python
"""Google Sheets/Drive API 클라이언트"""
from __future__ import annotations
import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build

log = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
]


def _get_credentials():
    sa_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    return service_account.Credentials.from_service_account_file(sa_path, scopes=SCOPES)


def build_sheets_service():
    return build("sheets", "v4", credentials=_get_credentials())


def build_drive_service():
    return build("drive", "v3", credentials=_get_credentials())


class SheetsClient:
    def __init__(self):
        self._sheets = build_sheets_service()
        self._drive = build_drive_service()

    def read_tab(self, spreadsheet_id: str, range_name: str) -> list[list[str]]:
        """시트 탭에서 전체 데이터 읽기"""
        result = (
            self._sheets.spreadsheets()
            .values()
            .get(spreadsheetId=spreadsheet_id, range=range_name, valueRenderOption="FORMATTED_VALUE")
            .execute()
        )
        return result.get("values", [])

    def append_rows(self, spreadsheet_id: str, tab_name: str, rows: list[list]) -> int:
        """시트 탭에 행 추가"""
        result = (
            self._sheets.spreadsheets()
            .values()
            .append(
                spreadsheetId=spreadsheet_id,
                range=f"{tab_name}!A:A",
                valueInputOption="USER_ENTERED",
                insertDataOption="INSERT_ROWS",
                body={"values": rows},
            )
            .execute()
        )
        return result.get("updates", {}).get("updatedRows", 0)

    def list_drive_sheets(self, folder_id: str) -> list[dict]:
        """드라이브 폴더 내 Google Sheets 파일 목록"""
        query = (
            f"'{folder_id}' in parents"
            " and mimeType='application/vnd.google-apps.spreadsheet'"
            " and trashed=false"
        )
        files = []
        page_token = None
        while True:
            resp = (
                self._drive.files()
                .list(
                    q=query,
                    fields="nextPageToken, files(id, name, modifiedTime)",
                    pageSize=100,
                    pageToken=page_token,
                    supportsAllDrives=True,
                    includeItemsFromAllDrives=True,
                )
                .execute()
            )
            files.extend(resp.get("files", []))
            page_token = resp.get("nextPageToken")
            if not page_token:
                break
        return files
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
python -m pytest tests/test_sheets_client.py -v
```
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/sheets_client.py scripts/campaign-flywheel/tests/test_sheets_client.py
git commit -m "feat: Google Sheets/Drive API client for campaign flywheel"
```

---

## Task 4: Sheet Scanner (공유 드라이브 → URL 추출)

**Files:**
- Create: `scripts/campaign-flywheel/sheet_scanner.py`
- Create: `scripts/campaign-flywheel/tests/test_sheet_scanner.py`

- [ ] **Step 1: 테스트 작성**

```python
# tests/test_sheet_scanner.py
"""sheet_scanner 단위 테스트"""
from __future__ import annotations
import pytest
from unittest.mock import MagicMock

from sheet_scanner import extract_ig_urls_from_rows, scan_all_sheets


def test_extract_ig_urls_finds_reel_urls():
    rows = [
        ["이름", "ID", "팔로워", "업로드 링크"],
        ["미쥬", "@iwbcd", "93,000", "https://www.instagram.com/reel/DIdsI9kzZ7X/"],
        ["손아미", "@snam8_", "160,000", "https://www.instagram.com/reel/DIvtQRDyEjW/"],
    ]
    results = extract_ig_urls_from_rows(rows, "녹십자웰빙", "sheet123")
    assert len(results) == 2
    assert results[0]["post_url"] == "https://www.instagram.com/reel/DIdsI9kzZ7X/"
    assert results[0]["creator_name"] == "미쥬"
    assert results[0]["ig_handle"] == "iwbcd"
    assert results[0]["brand_name"] == "녹십자웰빙"


def test_extract_ig_urls_finds_post_urls():
    rows = [
        ["IG ID", "NAME", "URL", "업로드 링크"],
        ["user1", "이름1", "https://instagram.com/user1", "https://www.instagram.com/p/ABC123/"],
    ]
    results = extract_ig_urls_from_rows(rows, "트리밍버드", "sheet456")
    assert len(results) == 1
    assert results[0]["post_type"] == "feed"


def test_extract_ig_urls_skips_profile_urls():
    rows = [
        ["IG ID", "URL", "업로드"],
        ["user1", "https://www.instagram.com/user1/", ""],
    ]
    results = extract_ig_urls_from_rows(rows, "test", "sheet789")
    assert len(results) == 0


def test_extract_ig_urls_handles_empty_rows():
    rows = [["header1", "header2"], ["", ""]]
    results = extract_ig_urls_from_rows(rows, "test", "sheetabc")
    assert results == []


def test_extract_creator_info_from_adjacent_columns():
    """URL 칼럼 좌측에서 크리에이터 정보를 추출"""
    rows = [
        ["사진", "IG ID", "NAME", "IG FW", "URL", "업로드 링크"],
        ["", "watashiwali", "리리", "48.1만", "https://instagram.com/watashiwali/", "https://www.instagram.com/reel/XYZ789/"],
    ]
    results = extract_ig_urls_from_rows(rows, "트리밍버드", "sheet000")
    assert len(results) == 1
    assert results[0]["ig_handle"] == "watashiwali"
    assert results[0]["creator_name"] == "리리"


def test_scan_all_sheets_deduplicates():
    mock_client = MagicMock()
    mock_client.list_drive_sheets.return_value = [
        {"id": "s1", "name": "[KOREANERS] 브랜드A 리스트"},
    ]
    mock_client.read_tab.return_value = [
        ["이름", "링크"],
        ["크리에이터1", "https://www.instagram.com/reel/AAA/"],
        ["크리에이터2", "https://www.instagram.com/reel/AAA/"],  # 중복
    ]
    existing_urls = set()
    results = scan_all_sheets(mock_client, existing_urls)
    # URL 중복 제거
    assert len(results) == 1


def test_scan_all_sheets_skips_existing_urls():
    mock_client = MagicMock()
    mock_client.list_drive_sheets.return_value = [
        {"id": "s1", "name": "[KOREANERS] 브랜드A 리스트"},
    ]
    mock_client.read_tab.return_value = [
        ["이름", "링크"],
        ["크리에이터1", "https://www.instagram.com/reel/AAA/"],
    ]
    existing_urls = {"https://www.instagram.com/reel/AAA/"}
    results = scan_all_sheets(mock_client, existing_urls)
    assert len(results) == 0
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
python -m pytest tests/test_sheet_scanner.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: sheet_scanner.py 구현**

```python
"""공유 드라이브 PM 시트에서 Instagram 콘텐츠 URL 자동 추출"""
from __future__ import annotations
import re
import logging
from config import PM_SHARED_DRIVE_FOLDER_ID, IG_URL_PATTERN
from sheets_client import SheetsClient

log = logging.getLogger(__name__)

# Instagram 콘텐츠 URL (프로필 URL 제외)
_IG_CONTENT_RE = re.compile(IG_URL_PATTERN)
# IG 핸들 추출: @handle 또는 instagram.com/handle
_IG_HANDLE_RE = re.compile(r"@?([\w.]+)")
# 브랜드명 추출: "[KOREANERS] 브랜드명 ..." 패턴
_BRAND_RE = re.compile(r"\[KOREANERS\]\s*(.+?)(?:\s+(?:진행|인플루언서|리스트|마케팅|매장|방문|체험|오프닝|클리닉))")


def _detect_post_type(url: str) -> str:
    if "/reel/" in url:
        return "reels"
    if "/stories/" in url:
        return "story"
    return "feed"


def _extract_brand_from_filename(filename: str) -> str:
    """시트 파일명에서 브랜드명 추출"""
    m = _BRAND_RE.search(filename)
    if m:
        return m.group(1).strip()
    # 폴백: [KOREANERS] 뒤의 첫 단어
    cleaned = filename.replace("[KOREANERS]", "").strip()
    return cleaned.split()[0] if cleaned else filename


def extract_ig_urls_from_rows(
    rows: list[list[str]],
    brand_name: str,
    sheet_id: str,
) -> list[dict]:
    """시트 행에서 Instagram 콘텐츠 URL + 크리에이터 정보 추출"""
    if not rows:
        return []

    results = []
    seen_urls: set[str] = set()
    header = rows[0] if rows else []

    # URL이 포함된 칼럼 인덱스 찾기 (각 행에서 동적 탐지)
    for row in rows[1:]:
        for col_idx, cell in enumerate(row):
            if not cell or not isinstance(cell, str):
                continue
            match = _IG_CONTENT_RE.search(cell)
            if not match:
                continue

            url = match.group(0).rstrip("/")
            if url in seen_urls:
                continue
            seen_urls.add(url)

            # URL 좌측 칼럼에서 크리에이터 정보 추출
            creator_name = None
            ig_handle = None
            for left_idx in range(col_idx):
                val = row[left_idx].strip() if left_idx < len(row) and row[left_idx] else ""
                if not val:
                    continue
                # IG 핸들 감지: @로 시작하거나 instagram.com/ 포함
                if val.startswith("@") or "instagram.com/" in val:
                    handle_match = _IG_HANDLE_RE.search(val.split("/")[-1] if "/" in val else val)
                    if handle_match:
                        ig_handle = handle_match.group(1)
                # 크리에이터 이름: 한글/일본어/영문 이름 (숫자 아닌 짧은 문자열)
                elif len(val) < 20 and not val.replace(",", "").replace(".", "").isdigit():
                    if not ig_handle:
                        # 핸들이 아직 없으면 이름 후보로
                        creator_name = val
                    elif not creator_name:
                        creator_name = val

            results.append({
                "brand_name": brand_name,
                "creator_name": creator_name,
                "ig_handle": ig_handle,
                "post_url": url,
                "post_type": _detect_post_type(url),
                "source_sheet_id": sheet_id,
            })

    return results


def scan_all_sheets(
    client: SheetsClient,
    existing_urls: set[str],
) -> list[dict]:
    """공유 드라이브 전체 시트 스캔 → 신규 URL만 반환"""
    files = client.list_drive_sheets(PM_SHARED_DRIVE_FOLDER_ID)
    log.info(f"공유 드라이브에서 {len(files)}개 시트 발견")

    all_results: list[dict] = []
    global_seen: set[str] = set(existing_urls)

    for f in files:
        sheet_id = f["id"]
        filename = f["name"]
        brand_name = _extract_brand_from_filename(filename)

        try:
            rows = client.read_tab(sheet_id, "A:Z")
        except Exception as e:
            log.warning(f"시트 읽기 실패 [{filename}]: {e}")
            continue

        # 시트에 탭이 여러 개일 수 있으므로 시트 정보 조회 후 각 탭 순회
        entries = extract_ig_urls_from_rows(rows, brand_name, sheet_id)

        for entry in entries:
            if entry["post_url"] not in global_seen:
                global_seen.add(entry["post_url"])
                all_results.append(entry)

    log.info(f"총 {len(all_results)}개 신규 URL 추출 (기존 {len(existing_urls)}개 제외)")
    return all_results
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
python -m pytest tests/test_sheet_scanner.py -v
```
Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/sheet_scanner.py scripts/campaign-flywheel/tests/test_sheet_scanner.py
git commit -m "feat: sheet scanner — auto-extract IG URLs from PM shared drive"
```

---

## Task 5: Apify Collector (Instagram 성과 수집)

**Files:**
- Create: `scripts/campaign-flywheel/apify_collector.py`
- Create: `scripts/campaign-flywheel/tests/test_apify_collector.py`

- [ ] **Step 1: 테스트 작성**

```python
# tests/test_apify_collector.py
"""apify_collector 단위 테스트"""
from __future__ import annotations
import pytest
from unittest.mock import MagicMock, patch

from apify_collector import collect_ig_metrics, parse_apify_result


def test_parse_apify_result_extracts_metrics():
    raw = {
        "videoPlayCount": 15000,
        "likesCount": 500,
        "commentsCount": 30,
        "videoViewCount": 15000,
    }
    metrics = parse_apify_result(raw)
    assert metrics["views"] == 15000
    assert metrics["likes"] == 500
    assert metrics["comments"] == 30


def test_parse_apify_result_handles_missing_fields():
    raw = {"likesCount": 100}
    metrics = parse_apify_result(raw)
    assert metrics["views"] == 0
    assert metrics["likes"] == 100
    assert metrics["shares"] == 0
    assert metrics["comments"] == 0


def test_parse_apify_result_prefers_play_count_for_reels():
    raw = {
        "videoPlayCount": 50000,
        "videoViewCount": 45000,
        "likesCount": 1000,
        "commentsCount": 50,
    }
    metrics = parse_apify_result(raw)
    assert metrics["views"] == 50000  # playCount 우선


def test_collect_ig_metrics_batches_urls():
    entries = [
        {"post_url": f"https://www.instagram.com/reel/URL{i}/"} for i in range(5)
    ]
    mock_client = MagicMock()
    mock_client.actor.return_value.call.return_value = MagicMock()
    mock_client.dataset.return_value.list_items.return_value = MagicMock(
        items=[{"videoPlayCount": 1000, "likesCount": 100, "commentsCount": 10, "url": f"https://www.instagram.com/reel/URL{i}/"} for i in range(5)]
    )

    with patch("apify_collector.ApifyClient", return_value=mock_client):
        results = collect_ig_metrics(entries)

    assert len(results) == 5
    assert all(r.get("views") is not None for r in results)
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
python -m pytest tests/test_apify_collector.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: apify_collector.py 구현**

```python
"""Apify Instagram Post Scraper를 사용한 성과 지표 수집"""
from __future__ import annotations
import os
import logging
from datetime import datetime, timezone
from apify_client import ApifyClient

from config import APIFY_ACTOR_ID

log = logging.getLogger(__name__)


def parse_apify_result(raw: dict) -> dict:
    """Apify 결과에서 성과 지표 추출"""
    views = raw.get("videoPlayCount") or raw.get("videoViewCount") or 0
    return {
        "views": views,
        "likes": raw.get("likesCount", 0),
        "shares": raw.get("sharesCount", 0),
        "comments": raw.get("commentsCount", 0),
    }


def collect_ig_metrics(entries: list[dict], batch_size: int = 25) -> list[dict]:
    """Instagram URL 리스트로부터 성과 지표 수집

    entries: sheet_scanner에서 나온 dict 리스트 (post_url 필수)
    returns: 원본 entry에 views/likes/shares/comments/collected_at 추가
    """
    if not entries:
        return []

    token = os.environ.get("APIFY_API_TOKEN", "")
    client = ApifyClient(token)
    now = datetime.now(timezone.utc).isoformat()

    urls = [e["post_url"] for e in entries]
    url_to_entry = {e["post_url"]: e for e in entries}

    # Apify에 배치로 전달
    for i in range(0, len(urls), batch_size):
        batch_urls = urls[i : i + batch_size]
        log.info(f"Apify 배치 {i // batch_size + 1}: {len(batch_urls)}개 URL")

        try:
            run = client.actor(APIFY_ACTOR_ID).call(
                run_input={
                    "directUrls": batch_urls,
                    "resultsLimit": len(batch_urls),
                }
            )
            dataset = client.dataset(run["defaultDatasetId"])
            items = dataset.list_items().items

            for item in items:
                # Apify 결과에서 원본 URL 매칭
                item_url = item.get("url") or item.get("inputUrl") or ""
                item_url = item_url.rstrip("/")
                # URL 매칭 시도
                matched_entry = url_to_entry.get(item_url)
                if not matched_entry:
                    # URL 정규화 후 재시도
                    for entry_url in url_to_entry:
                        if entry_url.rstrip("/") in item_url or item_url in entry_url:
                            matched_entry = url_to_entry[entry_url]
                            break
                if matched_entry:
                    metrics = parse_apify_result(item)
                    matched_entry.update(metrics)
                    matched_entry["collected_at"] = now

        except Exception as e:
            log.error(f"Apify 배치 실패: {e}")
            # 실패한 배치의 entry에 기본값 설정
            for url in batch_urls:
                entry = url_to_entry.get(url)
                if entry and "collected_at" not in entry:
                    entry.update({"views": 0, "likes": 0, "shares": 0, "comments": 0, "collected_at": now})

    # collected_at 없는 entry에 기본값
    for entry in entries:
        if "collected_at" not in entry:
            entry.update({"views": 0, "likes": 0, "shares": 0, "comments": 0, "collected_at": now})

    log.info(f"Apify 수집 완료: {len(entries)}개")
    return entries
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
python -m pytest tests/test_apify_collector.py -v
```
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/apify_collector.py scripts/campaign-flywheel/tests/test_apify_collector.py
git commit -m "feat: Apify Instagram collector — batch metrics collection"
```

---

## Task 6: Dashboard ETL (MKT Ops Master → Supabase)

**Files:**
- Create: `scripts/campaign-flywheel/dashboard_etl.py`
- Create: `scripts/campaign-flywheel/tests/test_dashboard_etl.py`

- [ ] **Step 1: 테스트 작성**

```python
# tests/test_dashboard_etl.py
"""dashboard_etl 단위 테스트"""
from __future__ import annotations
import pytest
from dashboard_etl import parse_dashboard_row, parse_money, parse_date


def test_parse_money_krw():
    assert parse_money("₩17,878,863") == 17878863.0


def test_parse_money_jpy():
    assert parse_money("¥460,000") == 460000.0


def test_parse_money_empty():
    assert parse_money("") == 0.0
    assert parse_money(None) == 0.0


def test_parse_date_korean_format():
    assert parse_date("2026. 1. 12") == "2026-01-12"
    assert parse_date("2026. 3. 6") == "2026-03-06"


def test_parse_date_empty():
    assert parse_date("") is None
    assert parse_date(None) is None


def test_parse_dashboard_row():
    row = [
        "2026-03-16 월",  # 0: DATE
        "2026-12W",  # 1: DATE_YW
        "2026-12W/방문건/밭 주식회사/감자밭",  # 2: CODE
        "밭 주식회사",  # 3: COMPANY_NAME
        "감자밭",  # 4: BRAND_NAME
        "클라이언트 정산 중",  # 5: STATUS
        "방문건",  # 6: CAMPAIGN_TYPE
        "IG reels",  # 7: MEDIA
        "링크",  # 8: OPERATION_SHEET
        "소희",  # 9: PM_PRIMARY
        "사야카",  # 10: PM_SECONDARY
        "2026. 1. 12",  # 11: START_DATE
        "2026. 1. 31",  # 12: END_DATE
        "수출바우처 메가 3명",  # 13: NOTE
        "",  # 14: empty
        "₩17,878,863",  # 15: CONTRACT_KRW
        "",  # 16: CONTRACT_JPY
        "",  # 17: CONTRACT_USD
        "",  # 18: COLLAB_FEE
        "₩7,000,000",  # 19: COST_KRW
        "¥460,000",  # 20: COST_JPY
        "6,514,483",  # 21: MARGIN_KRW
    ]
    record = parse_dashboard_row(row)
    assert record["campaign_code"] == "2026-12W/방문건/밭 주식회사/감자밭"
    assert record["brand_name"] == "감자밭"
    assert record["contract_amount_krw"] == 17878863.0
    assert record["cost_jpy"] == 460000.0
    assert record["pm_primary"] == "소희"
    assert record["start_date"] == "2026-01-12"


def test_parse_dashboard_row_skips_empty_code():
    row = ["", "", "", "", "", "", "", "", "", "", "", "", "", ""]
    record = parse_dashboard_row(row)
    assert record is None


def test_detect_newly_completed(monkeypatch):
    """운영-status가 '진행 완료'인 신규 캠페인 감지"""
    from dashboard_etl import detect_newly_completed

    records = [
        {"campaign_code": "A", "status": "진행 완료"},
        {"campaign_code": "B", "status": "섭외 중"},
        {"campaign_code": "C", "status": "진행 완료"},
    ]
    already_reviewed = {"A"}
    newly = detect_newly_completed(records, already_reviewed)
    assert newly == [{"campaign_code": "C", "status": "진행 완료"}]
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
python -m pytest tests/test_dashboard_etl.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: dashboard_etl.py 구현**

```python
"""MKT Ops Master Dashboard 탭 → Supabase campaign_financials ETL"""
from __future__ import annotations
import re
import logging
from config import DashboardCol, MKT_OPS_MASTER_SHEET_ID, DASHBOARD_TAB, COMPLETION_STATUS

log = logging.getLogger(__name__)


def parse_money(raw: str | None) -> float:
    """'₩17,878,863' 또는 '¥460,000' → float"""
    if not raw:
        return 0.0
    cleaned = re.sub(r"[₩¥$,\s]", "", str(raw))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_date(raw: str | None) -> str | None:
    """'2026. 1. 12' → '2026-01-12'"""
    if not raw or not raw.strip():
        return None
    m = re.match(r"(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})", raw.strip())
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return None


def _safe_get(row: list, idx: int) -> str:
    """안전한 인덱스 접근"""
    if idx < len(row):
        return str(row[idx]).strip() if row[idx] else ""
    return ""


def parse_dashboard_row(row: list) -> dict | None:
    """Dashboard 탭 1행 → campaign_financials 레코드"""
    code = _safe_get(row, DashboardCol.CODE)
    if not code:
        return None

    brand = _safe_get(row, DashboardCol.BRAND_NAME)
    if not brand:
        return None

    return {
        "campaign_code": code,
        "company_name": _safe_get(row, DashboardCol.COMPANY_NAME),
        "brand_name": brand,
        "campaign_type": _safe_get(row, DashboardCol.CAMPAIGN_TYPE),
        "media": _safe_get(row, DashboardCol.MEDIA),
        "contract_amount_krw": parse_money(_safe_get(row, DashboardCol.CONTRACT_KRW)),
        "contract_amount_jpy": parse_money(_safe_get(row, DashboardCol.CONTRACT_JPY)),
        "contract_amount_usd": parse_money(_safe_get(row, DashboardCol.CONTRACT_USD)),
        "cost_krw": parse_money(_safe_get(row, DashboardCol.COST_KRW)),
        "cost_jpy": parse_money(_safe_get(row, DashboardCol.COST_JPY)),
        "margin_krw": parse_money(_safe_get(row, DashboardCol.MARGIN_KRW)),
        "status": _safe_get(row, DashboardCol.STATUS),
        "start_date": parse_date(_safe_get(row, DashboardCol.START_DATE)),
        "end_date": parse_date(_safe_get(row, DashboardCol.END_DATE)),
        "pm_primary": _safe_get(row, DashboardCol.PM_PRIMARY),
        "pm_secondary": _safe_get(row, DashboardCol.PM_SECONDARY),
    }


def parse_all_dashboard_rows(rows: list[list]) -> list[dict]:
    """Dashboard 탭 전체 → 레코드 리스트 (헤더 제외)"""
    records = []
    for row in rows[1:]:  # 헤더 스킵
        record = parse_dashboard_row(row)
        if record:
            records.append(record)
    return records


def detect_newly_completed(records: list[dict], already_reviewed: set[str]) -> list[dict]:
    """'진행 완료' 상태의 신규 캠페인 감지"""
    return [
        r for r in records
        if r["status"] == COMPLETION_STATUS and r["campaign_code"] not in already_reviewed
    ]
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
python -m pytest tests/test_dashboard_etl.py -v
```
Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/dashboard_etl.py scripts/campaign-flywheel/tests/test_dashboard_etl.py
git commit -m "feat: Dashboard ETL — parse MKT Ops Master financial data"
```

---

## Task 7: Insight Writer (결과 → insight 탭 + Supabase)

**Files:**
- Create: `scripts/campaign-flywheel/insight_writer.py`
- Create: `scripts/campaign-flywheel/tests/test_insight_writer.py`

- [ ] **Step 1: 테스트 작성**

```python
# tests/test_insight_writer.py
"""insight_writer 단위 테스트"""
from __future__ import annotations
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from insight_writer import format_insight_row, write_to_supabase


def test_format_insight_row():
    entry = {
        "brand_name": "녹십자웰빙",
        "creator_name": "미쥬",
        "ig_handle": "iwbcd",
        "post_url": "https://instagram.com/reel/ABC/",
        "post_type": "reels",
        "views": 15000,
        "likes": 500,
        "shares": 30,
        "comments": 20,
        "collected_at": "2026-03-30T10:00:00+00:00",
    }
    row = format_insight_row(entry)
    # insight 탭 칼럼: 날짜, 인플루언서닉네임, 카테고리, 브랜드명, 유형, 뷰, 좋아요, 공유, 댓글
    assert row[1] == "iwbcd"  # 인플루언서닉네임 = IG 핸들
    assert row[3] == "녹십자웰빙"  # 브랜드명
    assert row[5] == 15000  # 뷰


def test_format_insight_row_uses_name_when_no_handle():
    entry = {
        "brand_name": "테스트",
        "creator_name": "미쥬",
        "ig_handle": None,
        "post_type": "reels",
        "views": 100,
        "likes": 10,
        "shares": 0,
        "comments": 0,
        "collected_at": "2026-03-30T10:00:00+00:00",
    }
    row = format_insight_row(entry)
    assert row[1] == "미쥬"


def test_write_to_supabase_upserts():
    mock_sb = MagicMock()
    mock_sb.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[{"id": "1"}])

    entries = [
        {
            "brand_name": "테스트",
            "creator_name": "크리에이터1",
            "ig_handle": "handle1",
            "post_url": "https://instagram.com/reel/A/",
            "post_type": "reels",
            "views": 100,
            "likes": 10,
            "shares": 0,
            "comments": 0,
            "collected_at": "2026-03-30T10:00:00+00:00",
            "source_sheet_id": "s1",
            "campaign_code": None,
        }
    ]
    count = write_to_supabase(mock_sb, entries)
    assert count == 1
    mock_sb.table.assert_called_with("campaign_posts")
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
python -m pytest tests/test_insight_writer.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: insight_writer.py 구현**

```python
"""수집 결과를 MKT Ops Master insight 탭 + Supabase에 기록"""
from __future__ import annotations
import logging
from datetime import datetime, timezone

from config import MKT_OPS_MASTER_SHEET_ID, INSIGHT_TAB
from sheets_client import SheetsClient

log = logging.getLogger(__name__)


def format_insight_row(entry: dict) -> list:
    """entry → insight 탭 행 형식
    칼럼: [빈칸, 날짜, 인플루언서닉네임, 카테고리, 브랜드명, 유형, 뷰, 좋아요, 공유, 댓글]
    """
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    nickname = entry.get("ig_handle") or entry.get("creator_name") or ""
    return [
        "",  # A열 (빈칸, insight 탭 Row 2 기준)
        date_str,
        nickname,
        "",  # 카테고리 (추후 매핑)
        entry.get("brand_name", ""),
        entry.get("post_type", ""),
        entry.get("views", 0),
        entry.get("likes", 0),
        entry.get("shares", 0),
        entry.get("comments", 0),
    ]


def write_to_insight_tab(client: SheetsClient, entries: list[dict]) -> int:
    """insight 탭에 행 추가"""
    if not entries:
        return 0
    rows = [format_insight_row(e) for e in entries]
    count = client.append_rows(MKT_OPS_MASTER_SHEET_ID, INSIGHT_TAB, rows)
    log.info(f"insight 탭에 {count}행 추가")
    return count


def write_to_supabase(supabase_client, entries: list[dict], batch_size: int = 50) -> int:
    """Supabase campaign_posts에 upsert"""
    if not entries:
        return 0

    records = []
    for e in entries:
        records.append({
            "brand_name": e.get("brand_name"),
            "creator_name": e.get("creator_name"),
            "ig_handle": e.get("ig_handle"),
            "post_url": e["post_url"],
            "post_type": e.get("post_type"),
            "views": e.get("views", 0),
            "likes": e.get("likes", 0),
            "shares": e.get("shares", 0),
            "comments": e.get("comments", 0),
            "collected_at": e.get("collected_at"),
            "source_sheet_id": e.get("source_sheet_id"),
            "campaign_code": e.get("campaign_code"),
        })

    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        supabase_client.table("campaign_posts").upsert(
            batch, on_conflict="post_url"
        ).execute()
        total += len(batch)

    log.info(f"Supabase campaign_posts에 {total}건 upsert")
    return total


def write_financials_to_supabase(supabase_client, records: list[dict], batch_size: int = 50) -> int:
    """Supabase campaign_financials에 upsert"""
    if not records:
        return 0

    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        supabase_client.table("campaign_financials").upsert(
            batch, on_conflict="campaign_code"
        ).execute()
        total += len(batch)

    log.info(f"Supabase campaign_financials에 {total}건 upsert")
    return total
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
python -m pytest tests/test_insight_writer.py -v
```
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/insight_writer.py scripts/campaign-flywheel/tests/test_insight_writer.py
git commit -m "feat: insight writer — write to insight tab + Supabase"
```

---

## Task 8: Review Generator (Claude 분석 → Notion + Slack)

**Files:**
- Create: `scripts/campaign-flywheel/review_generator.py`
- Create: `scripts/campaign-flywheel/tests/test_review_generator.py`

- [ ] **Step 1: 테스트 작성**

```python
# tests/test_review_generator.py
"""review_generator 단위 테스트"""
from __future__ import annotations
import pytest
from unittest.mock import MagicMock, patch

from review_generator import (
    build_completion_review_prompt,
    build_periodic_review_prompt,
    calculate_campaign_kpis,
)


def test_calculate_campaign_kpis():
    posts = [
        {"views": 10000, "likes": 500, "shares": 50, "comments": 30, "ig_handle": "a"},
        {"views": 20000, "likes": 1000, "shares": 100, "comments": 60, "ig_handle": "b"},
    ]
    financials = {
        "contract_amount_krw": 5000000,
        "cost_krw": 2000000,
        "margin_krw": 3000000,
    }
    kpis = calculate_campaign_kpis(posts, financials)
    assert kpis["total_views"] == 30000
    assert kpis["total_likes"] == 1500
    assert kpis["total_engagement"] == 1740  # likes + shares + comments
    assert kpis["avg_engagement_rate"] > 0
    assert kpis["cpv"] == pytest.approx(5000000 / 30000, rel=0.01)  # 계약액/총조회
    assert kpis["creator_count"] == 2
    assert kpis["margin_rate"] == pytest.approx(60.0, rel=0.1)  # 3M/5M * 100


def test_calculate_campaign_kpis_zero_views():
    posts = [{"views": 0, "likes": 0, "shares": 0, "comments": 0, "ig_handle": "a"}]
    financials = {"contract_amount_krw": 1000000, "cost_krw": 500000, "margin_krw": 500000}
    kpis = calculate_campaign_kpis(posts, financials)
    assert kpis["cpv"] == 0  # division by zero 방지
    assert kpis["avg_engagement_rate"] == 0


def test_build_completion_review_prompt_contains_kpis():
    kpis = {
        "total_views": 30000,
        "total_likes": 1500,
        "total_engagement": 1740,
        "avg_engagement_rate": 5.8,
        "cpv": 166.7,
        "cpe": 2873.6,
        "creator_count": 2,
        "margin_rate": 60.0,
        "top_creators": [{"ig_handle": "b", "views": 20000}],
        "bottom_creators": [{"ig_handle": "a", "views": 10000}],
    }
    campaign = {"brand_name": "감자밭", "campaign_type": "방문건", "media": "IG reels"}
    prompt = build_completion_review_prompt(kpis, campaign)
    assert "감자밭" in prompt
    assert "30,000" in prompt or "30000" in prompt
    assert "CPV" in prompt


def test_build_periodic_review_prompt():
    summary = {
        "total_campaigns": 10,
        "active_campaigns": 3,
        "total_contract_krw": 50000000,
        "total_margin_krw": 20000000,
        "period": "2026-03-17 ~ 2026-03-30",
    }
    prompt = build_periodic_review_prompt(summary)
    assert "50,000,000" in prompt or "50000000" in prompt
    assert "2026-03-17" in prompt
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
python -m pytest tests/test_review_generator.py -v
```
Expected: ModuleNotFoundError

- [ ] **Step 3: review_generator.py 구현**

```python
"""Claude 기반 캠페인 회고 + 정기 리뷰 생성 → Notion + Slack"""
from __future__ import annotations
import os
import json
import logging
from datetime import datetime, timezone

import anthropic
from notion_client import Client as NotionClient

log = logging.getLogger(__name__)


def calculate_campaign_kpis(posts: list[dict], financials: dict) -> dict:
    """캠페인 성과 KPI 계산"""
    total_views = sum(p.get("views", 0) for p in posts)
    total_likes = sum(p.get("likes", 0) for p in posts)
    total_shares = sum(p.get("shares", 0) for p in posts)
    total_comments = sum(p.get("comments", 0) for p in posts)
    total_engagement = total_likes + total_shares + total_comments

    contract = financials.get("contract_amount_krw", 0)
    creator_handles = {p.get("ig_handle") or p.get("creator_name") for p in posts}

    # 크리에이터별 성과 정렬
    creator_stats = {}
    for p in posts:
        key = p.get("ig_handle") or p.get("creator_name") or "unknown"
        if key not in creator_stats:
            creator_stats[key] = {"ig_handle": key, "views": 0, "engagement": 0}
        creator_stats[key]["views"] += p.get("views", 0)
        creator_stats[key]["engagement"] += (
            p.get("likes", 0) + p.get("shares", 0) + p.get("comments", 0)
        )
    sorted_creators = sorted(creator_stats.values(), key=lambda x: x["views"], reverse=True)

    return {
        "total_views": total_views,
        "total_likes": total_likes,
        "total_shares": total_shares,
        "total_comments": total_comments,
        "total_engagement": total_engagement,
        "avg_engagement_rate": (total_engagement / total_views * 100) if total_views > 0 else 0,
        "cpv": (contract / total_views) if total_views > 0 else 0,
        "cpe": (contract / total_engagement) if total_engagement > 0 else 0,
        "creator_count": len(creator_handles),
        "margin_rate": (financials.get("margin_krw", 0) / contract * 100) if contract > 0 else 0,
        "top_creators": sorted_creators[:3],
        "bottom_creators": sorted_creators[-3:] if len(sorted_creators) > 3 else [],
    }


def build_completion_review_prompt(kpis: dict, campaign: dict) -> str:
    """캠페인 완료 회고 프롬프트"""
    return f"""다음 캠페인의 성과를 분석하고 회고 리포트를 작성해주세요.

## 캠페인 정보
- 브랜드: {campaign.get('brand_name', '')}
- 유형: {campaign.get('campaign_type', '')}
- 매체: {campaign.get('media', '')}

## 성과 데이터
- 크리에이터 수: {kpis['creator_count']}명
- 총 조회수: {kpis['total_views']:,}
- 총 좋아요: {kpis['total_likes']:,}
- 총 engagement: {kpis['total_engagement']:,}
- 평균 engagement rate: {kpis['avg_engagement_rate']:.1f}%
- CPV (조회당 비용): ₩{kpis['cpv']:,.0f}
- CPE (engagement당 비용): ₩{kpis['cpe']:,.0f}
- 마진율: {kpis['margin_rate']:.1f}%

## Top 크리에이터
{json.dumps(kpis['top_creators'], ensure_ascii=False, indent=2)}

## Bottom 크리에이터
{json.dumps(kpis['bottom_creators'], ensure_ascii=False, indent=2)}

## 요청사항
다음 구조로 회고 리포트를 작성해주세요:
1. **성과 요약** (2-3문장)
2. **비용 효율 분석** — CPV, CPE가 업종 벤치마크 대비 어떤지
3. **Top/Bottom 크리에이터 분석** — 성과 차이 원인 추정
4. **다음 캠페인 제안** — 크리에이터 재기용, 단가 조정, 매체 변경 등 구체적 액션아이템 3-5개

마크다운 금지. 평서문으로 작성. 숫자에는 천단위 콤마 사용."""


def build_periodic_review_prompt(summary: dict) -> str:
    """정기 사업 리뷰 프롬프트"""
    return f"""다음은 코리너스 인플루언서 마케팅 사업의 {summary['period']} 기간 데이터입니다.

## 사업 현황
- 총 캠페인 수: {summary['total_campaigns']}건
- 진행 중 캠페인: {summary['active_campaigns']}건
- 기간 총 계약액: ₩{summary['total_contract_krw']:,}
- 기간 총 마진: ₩{summary['total_margin_krw']:,}

## 기간 비교
- 이전 기간 계약액: ₩{summary.get('prev_contract_krw', 0):,}
- 이전 기간 마진: ₩{summary.get('prev_margin_krw', 0):,}

## 크리에이터 풀
- 기간 내 활동 크리에이터: {summary.get('active_creators', 0)}명
- 신규 투입: {summary.get('new_creators', 0)}명
- 재기용: {summary.get('returning_creators', 0)}명

## 브랜드
- 신규 브랜드: {summary.get('new_brands', 0)}개
- 재계약 브랜드: {summary.get('returning_brands', 0)}개

## 요청사항
다음 구조로 격주 사업 리뷰를 작성해주세요:
1. **핵심 요약** (3줄)
2. **파이프라인 현황**
3. **기간 비교 분석** — 성장/정체/하락 판단과 원인
4. **크리에이터 풀 헬스** — 가동률, 쏠림 여부
5. **브랜드 리텐션** — 재계약율, 업종 집중도
6. **액션아이템** — 3-5개, 구체적이고 실행 가능한 것만

마크다운 금지. 평서문으로 작성. 숫자에는 천단위 콤마 사용."""


def generate_review(prompt: str) -> str:
    """Claude API로 리뷰 생성"""
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def create_notion_review_page(
    review_type: str,
    title: str,
    content: str,
    action_items: list[str],
) -> str:
    """Notion에 리뷰 페이지 생성. 반환: page_id"""
    notion = NotionClient(auth=os.environ["NOTION_TOKEN"])

    children = [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {"rich_text": [{"type": "text", "text": {"content": content}}]},
        }
    ]

    if action_items:
        children.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {"rich_text": [{"type": "text", "text": {"content": "액션아이템"}}]},
        })
        for item in action_items:
            children.append({
                "object": "block",
                "type": "to_do",
                "to_do": {
                    "rich_text": [{"type": "text", "text": {"content": item}}],
                    "checked": False,
                },
            })

    page = notion.pages.create(
        parent={"database_id": os.environ.get("NOTION_REVIEW_DB_ID", "")},
        properties={
            "이름": {"title": [{"text": {"content": title}}]},
        },
        children=children,
    )
    return page["id"]


def notify_slack_review(title: str, summary: str, review_type: str):
    """Slack에 리뷰 알림"""
    from krns_automation import notify_slack

    emoji = "📊" if review_type == "periodic" else "✅"
    notify_slack(f"{emoji} {title}", "success", summary[:500])
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
python -m pytest tests/test_review_generator.py -v
```
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/review_generator.py scripts/campaign-flywheel/tests/test_review_generator.py
git commit -m "feat: review generator — Claude analysis + Notion + Slack"
```

---

## Task 9: 엔트리포인트 (run_collect.py + run_review.py)

**Files:**
- Create: `scripts/campaign-flywheel/run_collect.py`
- Create: `scripts/campaign-flywheel/run_review.py`

- [ ] **Step 1: run_collect.py 작성 (수집 파이프라인)**

```python
#!/usr/bin/env python3
"""캠페인 성과 수집 파이프라인 — 주 2회 (화/금) 실행

1. 공유 드라이브 PM 시트 스캔 → IG URL 추출
2. Apify로 성과 지표 수집
3. insight 탭 + Supabase에 기록
4. Dashboard 탭 → Supabase campaign_financials 동기화
5. "진행 완료" 신규 감지 → 캠페인 회고 자동 생성
"""
from __future__ import annotations
import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone

# 공유 모듈 로드
sys.path.insert(0, str(Path.home() / ".config" / "shared-env"))
from krns_automation import wait_for_network, notify_slack, ping_healthcheck, load_env

SCRIPT_DIR = Path(__file__).parent
load_env(SCRIPT_DIR)

from config import LOG_DIR, LOG_FILE, MKT_OPS_MASTER_SHEET_ID, DASHBOARD_TAB
from sheets_client import SheetsClient
from sheet_scanner import scan_all_sheets
from apify_collector import collect_ig_metrics
from insight_writer import write_to_insight_tab, write_to_supabase, write_financials_to_supabase
from dashboard_etl import parse_all_dashboard_rows, detect_newly_completed
from review_generator import (
    calculate_campaign_kpis,
    build_completion_review_prompt,
    generate_review,
    create_notion_review_page,
    notify_slack_review,
)

LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


def main():
    ping_healthcheck("start")
    wait_for_network()

    from supabase import create_client
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    try:
        sheets = SheetsClient()

        # === Phase 1: 콘텐츠 성과 수집 ===
        log.info("=== 콘텐츠 성과 수집 시작 ===")

        # 기존 URL 조회 (중복 방지)
        existing = sb.table("campaign_posts").select("post_url").execute()
        existing_urls = {r["post_url"] for r in (existing.data or [])}
        log.info(f"기존 URL {len(existing_urls)}개")

        # 시트 스캔 + URL 추출
        new_entries = scan_all_sheets(sheets, existing_urls)

        if new_entries:
            # Apify 수집
            new_entries = collect_ig_metrics(new_entries)
            # insight 탭 + Supabase 기록
            write_to_insight_tab(sheets, new_entries)
            write_to_supabase(sb, new_entries)
        else:
            log.info("신규 URL 없음 — 수집 스킵")

        # === Phase 2: 재무 데이터 동기화 ===
        log.info("=== 재무 데이터 동기화 ===")
        dashboard_rows = sheets.read_tab(MKT_OPS_MASTER_SHEET_ID, f"{DASHBOARD_TAB}!A:AJ")
        fin_records = parse_all_dashboard_rows(dashboard_rows)
        write_financials_to_supabase(sb, fin_records)

        # === Phase 3: 캠페인 완료 회고 감지 ===
        log.info("=== 캠페인 완료 감지 ===")
        reviewed = sb.table("campaign_reviews").select("campaign_code").eq("review_type", "completion").execute()
        already_reviewed = {r["campaign_code"] for r in (reviewed.data or []) if r["campaign_code"]}

        newly_completed = detect_newly_completed(fin_records, already_reviewed)
        for campaign in newly_completed:
            code = campaign["campaign_code"]
            brand = campaign["brand_name"]
            log.info(f"캠페인 완료 감지: {brand} ({code})")

            # 해당 캠페인 포스트 조회
            posts_resp = sb.table("campaign_posts").select("*").eq("brand_name", brand).execute()
            posts = posts_resp.data or []

            if not posts:
                log.warning(f"  {brand}: 성과 데이터 없음 — 회고 스킵")
                continue

            kpis = calculate_campaign_kpis(posts, campaign)
            prompt = build_completion_review_prompt(kpis, campaign)
            review_text = generate_review(prompt)

            # Notion 페이지 생성
            title = f"[회고] {brand} — {datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
            notion_id = create_notion_review_page("completion", title, review_text, [])

            # Supabase 기록
            sb.table("campaign_reviews").insert({
                "review_type": "completion",
                "campaign_code": code,
                "insights_json": {"text": review_text, "kpis": kpis},
                "notion_page_id": notion_id,
            }).execute()

            notify_slack_review(title, review_text[:300], "completion")
            log.info(f"  회고 생성 완료: {title}")

        log.info("=== 수집 파이프라인 완료 ===")
        notify_slack("캠페인 플라이휠 수집", "success", f"신규 {len(new_entries)}건, 재무 {len(fin_records)}건, 회고 {len(newly_completed)}건")
        ping_healthcheck("success")

    except Exception as e:
        log.error(f"파이프라인 실패: {e}", exc_info=True)
        notify_slack("캠페인 플라이휠 수집", "fail", str(e))
        ping_healthcheck("fail", str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: run_review.py 작성 (정기 리뷰)**

```python
#!/usr/bin/env python3
"""정기 사업 리뷰 — 격주 월요일 실행

Supabase 전체 데이터 집계 → Claude 분석 → Notion + Slack
"""
from __future__ import annotations
import os
import sys
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path.home() / ".config" / "shared-env"))
from krns_automation import wait_for_network, notify_slack, ping_healthcheck, load_env

SCRIPT_DIR = Path(__file__).parent
load_env(SCRIPT_DIR)

from config import LOG_DIR, LOG_FILE, REVIEW_PERIODIC_DAYS
from review_generator import (
    build_periodic_review_prompt,
    generate_review,
    create_notion_review_page,
    notify_slack_review,
)

LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


def main():
    ping_healthcheck("start")
    wait_for_network()

    from supabase import create_client
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    try:
        now = datetime.now(timezone.utc)
        period_start = (now - timedelta(days=REVIEW_PERIODIC_DAYS)).strftime("%Y-%m-%d")
        period_end = now.strftime("%Y-%m-%d")

        log.info(f"=== 정기 리뷰 {period_start} ~ {period_end} ===")

        # 현재 기간 재무 데이터
        current = sb.table("campaign_financials").select("*").gte("start_date", period_start).execute()
        current_data = current.data or []

        # 이전 기간 재무 데이터
        prev_start = (now - timedelta(days=REVIEW_PERIODIC_DAYS * 2)).strftime("%Y-%m-%d")
        prev = sb.table("campaign_financials").select("*").gte("start_date", prev_start).lt("start_date", period_start).execute()
        prev_data = prev.data or []

        # 현재 기간 포스트 데이터
        posts = sb.table("campaign_posts").select("ig_handle, brand_name").gte("collected_at", period_start).execute()
        posts_data = posts.data or []

        # 이전 기간 포스트에서 기존 크리에이터/브랜드 집합
        all_prev_posts = sb.table("campaign_posts").select("ig_handle, brand_name").lt("collected_at", period_start).execute()
        prev_handles = {p["ig_handle"] for p in (all_prev_posts.data or []) if p.get("ig_handle")}
        prev_brands = {p["brand_name"] for p in (all_prev_posts.data or []) if p.get("brand_name")}

        current_handles = {p["ig_handle"] for p in posts_data if p.get("ig_handle")}
        current_brands = {p["brand_name"] for p in posts_data if p.get("brand_name")}

        active_statuses = {"섭외 중", "운영 중", "인플루언서 정산 중", "클라이언트 정산 중"}

        summary = {
            "period": f"{period_start} ~ {period_end}",
            "total_campaigns": len(current_data),
            "active_campaigns": sum(1 for r in current_data if r.get("status") in active_statuses),
            "total_contract_krw": sum(r.get("contract_amount_krw", 0) for r in current_data),
            "total_margin_krw": sum(r.get("margin_krw", 0) for r in current_data),
            "prev_contract_krw": sum(r.get("contract_amount_krw", 0) for r in prev_data),
            "prev_margin_krw": sum(r.get("margin_krw", 0) for r in prev_data),
            "active_creators": len(current_handles),
            "new_creators": len(current_handles - prev_handles),
            "returning_creators": len(current_handles & prev_handles),
            "new_brands": len(current_brands - prev_brands),
            "returning_brands": len(current_brands & prev_brands),
        }

        prompt = build_periodic_review_prompt(summary)
        review_text = generate_review(prompt)

        title = f"[격주 리뷰] {period_start} ~ {period_end}"
        notion_id = create_notion_review_page("periodic", title, review_text, [])

        sb.table("campaign_reviews").insert({
            "review_type": "periodic",
            "period_start": period_start,
            "period_end": period_end,
            "insights_json": {"text": review_text, "summary": summary},
            "notion_page_id": notion_id,
        }).execute()

        notify_slack_review(title, review_text[:500], "periodic")
        log.info("정기 리뷰 생성 완료")
        ping_healthcheck("success")

    except Exception as e:
        log.error(f"정기 리뷰 실패: {e}", exc_info=True)
        notify_slack("캠페인 정기 리뷰", "fail", str(e))
        ping_healthcheck("fail", str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add scripts/campaign-flywheel/run_collect.py scripts/campaign-flywheel/run_review.py
git commit -m "feat: entrypoints — run_collect (Tue/Fri) + run_review (biweekly Mon)"
```

---

## Task 10: launchd plist 등록

**Files:**
- Create: `~/Library/LaunchAgents/com.krns.campaign-collect.plist`
- Create: `~/Library/LaunchAgents/com.krns.campaign-review.plist`

- [ ] **Step 1: 수집 plist 작성 (화/금 10:00)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.krns.campaign-collect</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/campaign-flywheel/run_collect.py</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
        <dict>
            <key>Weekday</key>
            <integer>2</integer>
            <key>Hour</key>
            <integer>10</integer>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
        <dict>
            <key>Weekday</key>
            <integer>5</integer>
            <key>Hour</key>
            <integer>10</integer>
            <key>Minute</key>
            <integer>0</integer>
        </dict>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/leo/logs/campaign-collect.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/leo/logs/campaign-collect.log</string>
</dict>
</plist>
```

- [ ] **Step 2: 리뷰 plist 작성 (격주 월 09:00)**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.krns.campaign-review</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/campaign-flywheel/run_review.py</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/leo/logs/campaign-review.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/leo/logs/campaign-review.log</string>
</dict>
</plist>
```

Note: launchd는 격주 설정 불가. run_review.py 내부에서 마지막 리뷰 날짜 체크하여 14일 미만이면 스킵하는 로직이 필요 (run_review.py에 이미 Supabase에서 마지막 리뷰 조회하는 가드 추가 필요).

- [ ] **Step 3: plist 등록**

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.krns.campaign-collect.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.krns.campaign-review.plist
```

- [ ] **Step 4: Commit (plist는 git 밖이므로 자동화 레지스트리만 업데이트)**

자동화 레지스트리(`memory/automation-registry.md`)에 2개 추가:
```
| Campaign Collect | `koreaners-global-landing-page/scripts/campaign-flywheel/run_collect.py` | launchd 화/금 10:00 | 시트 스캔→Apify 수집→insight 탭+Supabase |
| Campaign Review | `koreaners-global-landing-page/scripts/campaign-flywheel/run_review.py` | launchd 매주 월 09:00 (격주 가드) | Claude 분석→Notion+Slack 정기 리뷰 |
```

---

## Task 11: 어드민 대시보드 — 인사이트 쿼리 + 계산

**Files:**
- Modify: `lib/dashboard/queries.ts`
- Modify: `lib/dashboard/calculations.ts`

- [ ] **Step 1: queries.ts에 인사이트 쿼리 추가**

`lib/dashboard/queries.ts` 파일 끝에 추가:

```typescript
// === Campaign Insights ===

export async function fetchCampaignPosts() {
  const { data, error } = await supabase
    .from('campaign_posts')
    .select('*')
    .order('collected_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchCampaignFinancials() {
  const { data, error } = await supabase
    .from('campaign_financials')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchCampaignReviews() {
  const { data, error } = await supabase
    .from('campaign_reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}
```

- [ ] **Step 2: calculations.ts에 CPV, CPE 계산 추가**

`lib/dashboard/calculations.ts` 파일 끝에 추가:

```typescript
// === Campaign Insight Calculations ===

export interface CampaignPostRow {
  brand_name: string
  creator_name: string | null
  ig_handle: string | null
  post_url: string
  post_type: string | null
  views: number
  likes: number
  shares: number
  comments: number
  collected_at: string | null
  campaign_code: string | null
}

export interface CampaignFinancialRow {
  campaign_code: string
  brand_name: string
  contract_amount_krw: number
  cost_krw: number
  margin_krw: number
  status: string
  start_date: string | null
  end_date: string | null
  pm_primary: string | null
}

export function engagementRate(post: CampaignPostRow): number {
  const engagement = post.likes + post.shares + post.comments
  return post.views > 0 ? (engagement / post.views) * 100 : 0
}

export function cpv(contractKrw: number, totalViews: number): number {
  return totalViews > 0 ? contractKrw / totalViews : 0
}

export function cpe(contractKrw: number, totalEngagement: number): number {
  return totalEngagement > 0 ? contractKrw / totalEngagement : 0
}

export function aggregateByCreator(posts: CampaignPostRow[]) {
  const map = new Map<string, { handle: string; name: string; views: number; engagement: number; postCount: number }>()
  for (const p of posts) {
    const key = p.ig_handle ?? p.creator_name ?? 'unknown'
    const existing = map.get(key) ?? { handle: key, name: p.creator_name ?? key, views: 0, engagement: 0, postCount: 0 }
    existing.views += p.views
    existing.engagement += p.likes + p.shares + p.comments
    existing.postCount += 1
    map.set(key, existing)
  }
  return Array.from(map.values()).sort((a, b) => b.views - a.views)
}

export function aggregateByBrand(posts: CampaignPostRow[], financials: CampaignFinancialRow[]) {
  const finMap = new Map(financials.map(f => [f.brand_name, f]))
  const postMap = new Map<string, { brand: string; totalViews: number; totalEngagement: number; postCount: number; contractKrw: number; marginKrw: number }>()

  for (const p of posts) {
    const existing = postMap.get(p.brand_name) ?? {
      brand: p.brand_name,
      totalViews: 0,
      totalEngagement: 0,
      postCount: 0,
      contractKrw: finMap.get(p.brand_name)?.contract_amount_krw ?? 0,
      marginKrw: finMap.get(p.brand_name)?.margin_krw ?? 0,
    }
    existing.totalViews += p.views
    existing.totalEngagement += p.likes + p.shares + p.comments
    existing.postCount += 1
    postMap.set(p.brand_name, existing)
  }

  return Array.from(postMap.values()).sort((a, b) => b.totalViews - a.totalViews)
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add lib/dashboard/queries.ts lib/dashboard/calculations.ts
git commit -m "feat: campaign insight queries and KPI calculations"
```

---

## Task 12: 어드민 대시보드 — 인사이트 페이지

**Files:**
- Create: `app/admin/insights/page.tsx`
- Create: `app/admin/insights/components/campaign-table.tsx`
- Create: `app/admin/insights/components/creator-report.tsx`
- Create: `app/admin/insights/components/trend-charts.tsx`
- Modify: `app/admin/page.tsx` (인사이트 카드 추가)

- [ ] **Step 1: campaign-table.tsx 작성**

```tsx
// app/admin/insights/components/campaign-table.tsx
'use client'

import { useState, useMemo } from 'react'
import { CampaignFinancialRow, CampaignPostRow, cpv, cpe } from '@/lib/dashboard/calculations'

interface Props {
  financials: CampaignFinancialRow[]
  posts: CampaignPostRow[]
}

export function CampaignTable({ financials, posts }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const postsByBrand = useMemo(() => {
    const map = new Map<string, { views: number; engagement: number; count: number }>()
    for (const p of posts) {
      const existing = map.get(p.brand_name) ?? { views: 0, engagement: 0, count: 0 }
      existing.views += p.views
      existing.engagement += p.likes + p.shares + p.comments
      existing.count += 1
      map.set(p.brand_name, existing)
    }
    return map
  }, [posts])

  const filtered = useMemo(() => {
    return financials.filter(f => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      if (search && !f.brand_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [financials, statusFilter, search])

  const statuses = [...new Set(financials.map(f => f.status).filter(Boolean))]

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="브랜드 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-200"
        >
          <option value="all">전체 상태</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800/50 text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left">브랜드</th>
              <th className="px-4 py-3 text-left">유형</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-right">계약액</th>
              <th className="px-4 py-3 text-right">마진</th>
              <th className="px-4 py-3 text-right">총 조회</th>
              <th className="px-4 py-3 text-right">CPV</th>
              <th className="px-4 py-3 text-left">담당자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filtered.map(f => {
              const brandPosts = postsByBrand.get(f.brand_name)
              const views = brandPosts?.views ?? 0
              const engagement = brandPosts?.engagement ?? 0
              return (
                <tr key={f.campaign_code} className="text-neutral-300 hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-medium text-neutral-100">{f.brand_name}</td>
                  <td className="px-4 py-3">{f.campaign_type ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-700">{f.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">₩{f.contract_amount_krw?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₩{f.margin_krw?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{views > 0 ? views.toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {views > 0 ? `₩${cpv(f.contract_amount_krw, views).toFixed(0)}` : '-'}
                  </td>
                  <td className="px-4 py-3">{f.pm_primary ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: creator-report.tsx 작성**

```tsx
// app/admin/insights/components/creator-report.tsx
'use client'

import { useMemo } from 'react'
import { CampaignPostRow, aggregateByCreator } from '@/lib/dashboard/calculations'

interface Props {
  posts: CampaignPostRow[]
}

export function CreatorReport({ posts }: Props) {
  const creators = useMemo(() => aggregateByCreator(posts), [posts])

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-800/50 text-neutral-400">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">크리에이터</th>
            <th className="px-4 py-3 text-right">콘텐츠 수</th>
            <th className="px-4 py-3 text-right">총 조회수</th>
            <th className="px-4 py-3 text-right">총 engagement</th>
            <th className="px-4 py-3 text-right">평균 ER</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {creators.slice(0, 50).map((c, i) => (
            <tr key={c.handle} className="text-neutral-300 hover:bg-neutral-800/30">
              <td className="px-4 py-3 text-neutral-500">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-neutral-100">
                @{c.handle}
                {c.name !== c.handle && <span className="ml-2 text-neutral-500">{c.name}</span>}
              </td>
              <td className="px-4 py-3 text-right">{c.postCount}</td>
              <td className="px-4 py-3 text-right">{c.views.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{c.engagement.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                {c.views > 0 ? `${(c.engagement / c.views * 100).toFixed(1)}%` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: trend-charts.tsx 작성**

```tsx
// app/admin/insights/components/trend-charts.tsx
'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { CampaignFinancialRow } from '@/lib/dashboard/calculations'

interface Props {
  financials: CampaignFinancialRow[]
}

export function TrendCharts({ financials }: Props) {
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; margin: number; count: number }>()
    for (const f of financials) {
      if (!f.start_date) continue
      const month = f.start_date.slice(0, 7) // YYYY-MM
      const existing = map.get(month) ?? { month, revenue: 0, margin: 0, count: 0 }
      existing.revenue += f.contract_amount_krw ?? 0
      existing.margin += f.margin_krw ?? 0
      existing.count += 1
      map.set(month, existing)
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [financials])

  const typeData = useMemo(() => {
    const map = new Map<string, { type: string; revenue: number; count: number }>()
    for (const f of financials) {
      const type = f.campaign_type ?? '미분류'
      const existing = map.get(type) ?? { type, revenue: 0, count: 0 }
      existing.revenue += f.contract_amount_krw ?? 0
      existing.count += 1
      map.set(type, existing)
    }
    return Array.from(map.values())
  }, [financials])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 월별 매출/마진 추이 */}
      <div className="rounded-xl border border-neutral-800 p-4">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">월별 매출/마진 추이</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} />
            <YAxis tick={{ fill: '#888', fontSize: 12 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              labelStyle={{ color: '#999' }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
            />
            <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="매출" />
            <Line type="monotone" dataKey="margin" stroke="#22c55e" strokeWidth={2} name="마진" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 캠페인 유형별 매출 */}
      <div className="rounded-xl border border-neutral-800 p-4">
        <h3 className="text-sm font-medium text-neutral-400 mb-4">캠페인 유형별 매출</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={typeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="type" tick={{ fill: '#888', fontSize: 12 }} />
            <YAxis tick={{ fill: '#888', fontSize: 12 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
            />
            <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} name="매출" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: insights/page.tsx 작성 (메인 페이지)**

```tsx
// app/admin/insights/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CampaignTable } from './components/campaign-table'
import { CreatorReport } from './components/creator-report'
import { TrendCharts } from './components/trend-charts'
import type { CampaignPostRow, CampaignFinancialRow } from '@/lib/dashboard/calculations'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Tab = 'campaigns' | 'creators' | 'trends'

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>('campaigns')
  const [posts, setPosts] = useState<CampaignPostRow[]>([])
  const [financials, setFinancials] = useState<CampaignFinancialRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [postsRes, finRes] = await Promise.all([
        supabase.from('campaign_posts').select('*').order('collected_at', { ascending: false }),
        supabase.from('campaign_financials').select('*').order('start_date', { ascending: false }),
      ])
      setPosts(postsRes.data ?? [])
      setFinancials(finRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-neutral-500">로딩 중...</div>
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'campaigns', label: '캠페인' },
    { key: 'creators', label: '크리에이터' },
    { key: 'trends', label: '트렌드' },
  ]

  // KPI 카드 데이터
  const totalViews = posts.reduce((s, p) => s + p.views, 0)
  const totalRevenue = financials.reduce((s, f) => s + (f.contract_amount_krw ?? 0), 0)
  const totalMargin = financials.reduce((s, f) => s + (f.margin_krw ?? 0), 0)
  const uniqueCreators = new Set(posts.map(p => p.ig_handle ?? p.creator_name).filter(Boolean)).size

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-50">캠페인 인사이트</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '총 조회수', value: totalViews.toLocaleString() },
          { label: '총 매출', value: `₩${(totalRevenue / 1000000).toFixed(1)}M` },
          { label: '총 마진', value: `₩${(totalMargin / 1000000).toFixed(1)}M` },
          { label: '크리에이터', value: `${uniqueCreators}명` },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">{kpi.label}</p>
            <p className="text-lg font-semibold text-neutral-100 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-neutral-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'text-orange-400 border-orange-400'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'campaigns' && <CampaignTable financials={financials} posts={posts} />}
      {tab === 'creators' && <CreatorReport posts={posts} />}
      {tab === 'trends' && <TrendCharts financials={financials} />}
    </div>
  )
}
```

- [ ] **Step 5: admin/page.tsx에 인사이트 카드 추가**

기존 `app/admin/page.tsx`에 "프로젝트 현황" 카드 아래에 추가:

```tsx
{/* 캠페인 인사이트 */}
<Link
  href="/admin/insights"
  className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-emerald-500/50 hover:bg-neutral-800/60 transition-all"
>
  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
    style={{ background: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.08) 0%, transparent 60%)' }}
  />
  <div className="relative space-y-3">
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <BarChart3 className="h-5 w-5 text-emerald-400" />
    </div>
    <div>
      <h2 className="font-semibold text-neutral-50 group-hover:text-emerald-300 transition-colors">
        캠페인 인사이트
      </h2>
      <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
        성과·크리에이터·매출 트렌드
      </p>
    </div>
    <span className="inline-flex items-center gap-1 text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
      이동 →
    </span>
  </div>
</Link>
```

`app/admin/page.tsx` 상단 import에 `BarChart3` 추가:
```tsx
import { LayoutDashboard, RefreshCw, BarChart3 } from 'lucide-react'
```

- [ ] **Step 6: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add app/admin/insights/ app/admin/page.tsx lib/dashboard/queries.ts lib/dashboard/calculations.ts
git commit -m "feat: admin insights dashboard — campaigns, creators, trends"
```

---

## Task 13: 수동 동기화 API

**Files:**
- Create: `app/api/sync/campaign-insights/route.ts`

- [ ] **Step 1: route.ts 작성**

```typescript
// app/api/sync/campaign-insights/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateSyncAuth } from '@/lib/sync-auth'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authResult = validateSyncAuth(req)
  if (!authResult.valid) {
    return NextResponse.json({ error: authResult.reason }, { status: 401 })
  }

  try {
    // Python 스크립트를 직접 실행하지 않고,
    // 어드민 대시보드에서 "마지막 동기화 시간" 표시 + 수동 트리거 안내용
    return NextResponse.json({
      message: '캠페인 인사이트 동기화는 자동화(화/금 10:00)로 실행됩니다. 수동 실행: python scripts/campaign-flywheel/run_collect.py',
      lastSync: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add app/api/sync/campaign-insights/route.ts
git commit -m "feat: campaign insights sync API endpoint"
```

---

## Task 14: E2E 검증

- [ ] **Step 1: Python 테스트 전체 실행**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/campaign-flywheel
python -m pytest tests/ -v --tb=short
```
Expected: 전체 통과 (26+ tests)

- [ ] **Step 2: dry run — 수집 파이프라인**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/campaign-flywheel
python run_collect.py
```
Expected: 로그에 시트 스캔 → URL 추출 → Apify 수집 → Supabase 적재 확인

- [ ] **Step 3: Supabase 데이터 확인**

Supabase 대시보드에서:
- `campaign_posts` 테이블에 데이터 있는지 확인
- `campaign_financials` 테이블에 Dashboard 탭 데이터 반영 확인

- [ ] **Step 4: 어드민 대시보드 확인**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
npm run dev
```
`http://localhost:3000/admin/insights` 접속하여:
- KPI 카드에 숫자 표시 확인
- 캠페인 테이블 필터 동작 확인
- 크리에이터 리포트 정렬 확인
- 트렌드 차트 렌더링 확인

- [ ] **Step 5: 최종 Commit**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
git add -A
git commit -m "feat: campaign performance flywheel — complete implementation"
```
