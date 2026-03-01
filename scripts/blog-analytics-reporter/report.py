#!/usr/bin/env python3
"""
Blog Analytics Weekly Reporter

GA4 + Search Console -> Notion Blog DB 속성 갱신 + 주간 리포트 DB 히스토리

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
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Filter,
    FilterExpression,
    Metric,
    RunReportRequest,
)
from googleapiclient.discovery import build
from notion_client import Client as NotionClient

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

# ── Constants ────────────────────────────────────────────────

REQUIRED_ENV = [
    "GOOGLE_SERVICE_ACCOUNT_JSON",
    "GA4_PROPERTY_ID",
    "GSC_SITE_URL",
    "NOTION_TOKEN",
    "NOTION_BLOG_DB_ID",
]


# ── Environment & Date ───────────────────────────────────────

def validate_env() -> None:
    """필수 환경 변수 존재 확인."""
    missing = [k for k in REQUIRED_ENV if not os.getenv(k)]
    if missing:
        raise EnvironmentError(f"Missing env vars: {', '.join(missing)}")

    sa_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if not Path(sa_path).is_file():
        raise FileNotFoundError(f"Service account file not found: {sa_path}")

    log.info("환경 변수 검증 완료")


def get_week_range() -> tuple[str, str]:
    """지난 주 월~일 날짜 범위 반환 (YYYY-MM-DD)."""
    today = datetime.now()
    days_since_monday = today.weekday()
    last_sunday = today - timedelta(days=days_since_monday + 1)
    last_monday = last_sunday - timedelta(days=6)
    return last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d")


# ── Google Auth ──────────────────────────────────────────────

SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
]


def get_google_credentials() -> service_account.Credentials:
    """Google 서비스 계정 인증 정보 로드."""
    sa_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    return service_account.Credentials.from_service_account_file(sa_path, scopes=SCOPES)


# ── GA4 Data Collection ──────────────────────────────────────

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
        page_path = row.dimension_values[0].value
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


# ── Search Console Data Collection ───────────────────────────

def fetch_gsc_data(start_date: str, end_date: str) -> dict[str, dict]:
    """Search Console에서 /blog/* 검색 성과 수집.

    Returns:
        {slug: {clicks, impressions, ctr, position}}
    """
    credentials = get_google_credentials()
    gsc_service = build("searchconsole", "v1", credentials=credentials)
    site_url = os.getenv("GSC_SITE_URL", "")

    body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["page"],
        "type": "web",
        "rowLimit": 25000,
        "dataState": "all",
    }

    response = gsc_service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    result: dict[str, dict] = {}

    for row in response.get("rows", []):
        page_url: str = row["keys"][0]

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


# ── Data Merge ───────────────────────────────────────────────

def merge_data(ga_data: dict[str, dict], gsc_data: dict[str, dict]) -> dict[str, dict]:
    """GA4 + GSC 데이터를 slug 기준으로 병합."""
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


# ── Notion Integration ───────────────────────────────────────

def get_notion_client() -> NotionClient:
    return NotionClient(auth=os.getenv("NOTION_TOKEN"))


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


def _heading(level: int, text: str) -> dict:
    """Notion heading block 생성."""
    key = f"heading_{level}"
    return {
        "object": "block",
        "type": key,
        key: {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def _table_row(cells: list[str]) -> dict:
    """Notion table row block 생성."""
    return {
        "object": "block",
        "type": "table_row",
        "table_row": {
            "cells": [[{"type": "text", "text": {"content": str(c)}}] for c in cells]
        },
    }


def _table(width: int, rows: list[dict], header: bool = True) -> dict:
    """Notion table block 생성."""
    return {
        "object": "block",
        "type": "table",
        "table": {
            "table_width": width,
            "has_column_header": header,
            "has_row_header": False,
            "children": rows,
        },
    }


def _build_report_blocks(merged: dict[str, dict]) -> list[dict]:
    """주간 리포트 본문 블록 생성 (요약 + 포스트별 테이블)."""
    blocks: list[dict] = []

    # 총합 계산
    total_pv = sum(d["pageviews"] for d in merged.values())
    total_clicks = sum(d["clicks"] for d in merged.values())
    total_impressions = sum(d["impressions"] for d in merged.values())
    avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
    avg_pos_values = [d["position"] for d in merged.values() if d["position"] > 0]
    avg_position = sum(avg_pos_values) / len(avg_pos_values) if avg_pos_values else 0.0
    post_count = len(merged)

    # ── 요약 섹션 ──
    blocks.append(_heading(2, "📊 주간 블로그 성과 요약"))
    summary_rows = [
        _table_row(["지표", "값"]),
        _table_row(["총 PV", f"{total_pv:,}"]),
        _table_row(["총 클릭", f"{total_clicks:,}"]),
        _table_row(["총 노출", f"{total_impressions:,}"]),
        _table_row(["평균 CTR", f"{avg_ctr:.1f}%"]),
        _table_row(["평균 순위", f"{avg_position:.1f}"]),
        _table_row(["포스트 수", str(post_count)]),
    ]
    blocks.append(_table(2, summary_rows))

    # ── 포스트별 상세 테이블 ──
    blocks.append(_heading(2, "📝 포스트별 상세"))
    sorted_posts = sorted(merged.items(), key=lambda x: x[1]["pageviews"], reverse=True)

    detail_rows = [_table_row(["순위", "포스트", "PV", "클릭", "노출", "CTR", "순위"])]
    for rank, (slug, data) in enumerate(sorted_posts, 1):
        ctr = data["ctr"] * 100 if data["ctr"] else 0.0
        detail_rows.append(_table_row([
            str(rank),
            slug,
            str(data["pageviews"]),
            str(data["clicks"]),
            str(data["impressions"]),
            f"{ctr:.1f}%",
            f"{data['position']:.1f}" if data["position"] > 0 else "-",
        ]))
    blocks.append(_table(7, detail_rows))

    return blocks


def _check_existing_report(notion: NotionClient, db_id: str, period_label: str) -> str | None:
    """같은 주차의 기존 리포트가 있는지 확인."""
    result = notion.databases.query(
        database_id=db_id,
        filter={
            "property": "리포트 기간",
            "title": {"equals": period_label},
        },
    )
    results = result.get("results", [])
    return results[0]["id"] if results else None


def create_weekly_report(merged: dict[str, dict], start_date: str, end_date: str) -> int:
    """Notion 주간 리포트 DB에 주차별 1페이지 생성 (요약 + 포스트별 테이블).

    Returns:
        1 (생성/업데이트) or 0
    """
    report_db_id = os.getenv("NOTION_REPORT_DB_ID", "")
    if not report_db_id:
        log.warning("NOTION_REPORT_DB_ID 미설정 — 주간 리포트 건너뜀")
        return 0

    if not merged:
        log.info("병합 데이터 없음 — 주간 리포트 건너뜀")
        return 0

    notion = get_notion_client()

    # ISO week 번호 계산
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    iso_year, iso_week, _ = start_dt.isocalendar()
    period_label = f"{iso_year}-W{iso_week:02d} ({start_date[5:]}~{end_date[5:]})"

    # 총합 계산
    total_pv = sum(d["pageviews"] for d in merged.values())
    total_clicks = sum(d["clicks"] for d in merged.values())
    total_impressions = sum(d["impressions"] for d in merged.values())
    avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
    avg_pos_values = [d["position"] for d in merged.values() if d["position"] > 0]
    avg_position = sum(avg_pos_values) / len(avg_pos_values) if avg_pos_values else 0.0

    properties = {
        "리포트 기간": {"title": [{"text": {"content": period_label}}]},
        "총 PV": {"number": total_pv},
        "총 클릭": {"number": total_clicks},
        "총 노출": {"number": total_impressions},
        "평균 CTR": {"number": round(avg_ctr, 1)},
        "평균 순위": {"number": round(avg_position, 1)},
        "포스트 수": {"number": len(merged)},
        "생성일": {"date": {"start": datetime.now().strftime("%Y-%m-%d")}},
    }
    children = _build_report_blocks(merged)

    try:
        existing_id = _check_existing_report(notion, report_db_id, period_label)
        if existing_id:
            log.info(f"기존 리포트 업데이트: {period_label}")
            notion.pages.update(page_id=existing_id, properties=properties)
            # 기존 본문 삭제 후 재생성
            existing_children = notion.blocks.children.list(block_id=existing_id)
            for block in existing_children.get("results", []):
                notion.blocks.delete(block_id=block["id"])
            notion.blocks.children.append(block_id=existing_id, children=children)
        else:
            log.info(f"새 리포트 생성: {period_label}")
            notion.pages.create(
                parent={"database_id": report_db_id},
                properties=properties,
                children=children,
            )
        return 1
    except Exception as e:
        log.error(f"리포트 생성/업데이트 실패: {e}")
        return 0


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
    log.info("Blog Analytics Report 완료!")
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
