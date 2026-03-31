#!/usr/bin/env python3
"""캠페인 플라이휠 — 수집 파이프라인 엔트리포인트 (화/금 10:00)

Flow:
  Phase 1: 콘텐츠 성과 수집 (PM 드라이브 시트 스캔 → Apify → Supabase)
  Phase 2: 재무 데이터 동기화 (Dashboard 탭 → campaign_financials)
  Phase 3: 캠페인 완료 회고 감지 (신규 완료 → KPI → 리뷰 → Notion + Slack)
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from pathlib import Path

# ── shared-env 경로 주입 ──
sys.path.insert(0, str(Path.home() / ".config" / "shared-env"))
from krns_automation import wait_for_network, notify_slack, ping_healthcheck, load_env

# ── 스크립트 디렉토리 ──
SCRIPT_DIR = Path(__file__).parent
load_env(SCRIPT_DIR)

# ── 로깅 ──
LOG_DIR = Path.home() / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "campaign-flywheel.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


def main() -> None:
    import os
    import supabase as supabase_lib
    from sheets_client import SheetsClient
    from sheet_scanner import scan_all_sheets
    from apify_collector import collect_ig_metrics
    from dashboard_etl import parse_all_dashboard_rows, detect_newly_completed
    from insight_writer import write_to_insight_tab, write_to_supabase, write_financials_to_supabase
    from review_generator import (
        calculate_campaign_kpis,
        build_completion_review_prompt,
        generate_review,
        create_notion_review_page,
        notify_slack_review,
    )
    from config import MKT_OPS_MASTER_SHEET_ID, DASHBOARD_TAB

    logger.info("=" * 60)
    logger.info("캠페인 플라이휠 수집 파이프라인 시작")
    logger.info("실행: %s", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    logger.info("=" * 60)

    # ── 클라이언트 초기화 ──
    sb = supabase_lib.create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
    sheets = SheetsClient()

    # ── Phase 1: 콘텐츠 성과 수집 ──
    logger.info("[Phase 1] 콘텐츠 성과 수집 시작")

    existing_res = sb.table("campaign_posts").select("post_url").execute()
    existing_urls: set[str] = {r["post_url"] for r in (existing_res.data or []) if r.get("post_url")}
    logger.info("기존 수집 URL: %d건", len(existing_urls))

    new_entries = scan_all_sheets(sheets, existing_urls)
    logger.info("신규 URL 발견: %d건", len(new_entries))

    if new_entries:
        enriched = collect_ig_metrics(new_entries)
        written_sheets = write_to_insight_tab(sheets, enriched)
        written_sb = write_to_supabase(sb, enriched)
        logger.info("Insight 탭 기록: %d행, Supabase 업로드: %d건", written_sheets, written_sb)
    else:
        logger.info("신규 콘텐츠 없음 — Phase 1 스킵")

    # ── Phase 2: 재무 데이터 동기화 ──
    logger.info("[Phase 2] 재무 데이터 동기화 시작")

    dashboard_rows = sheets.read_tab(MKT_OPS_MASTER_SHEET_ID, DASHBOARD_TAB)
    records = parse_all_dashboard_rows(dashboard_rows)
    written_fin = write_financials_to_supabase(sb, records)
    logger.info("campaign_financials upsert: %d건", written_fin)

    # ── Phase 3: 캠페인 완료 회고 감지 ──
    logger.info("[Phase 3] 캠페인 완료 회고 감지 시작")

    reviewed_res = sb.table("campaign_reviews").select("campaign_code").execute()
    already_reviewed: set[str] = {
        r["campaign_code"] for r in (reviewed_res.data or []) if r.get("campaign_code")
    }

    newly_completed = detect_newly_completed(records, already_reviewed)
    logger.info("미리뷰 완료 캠페인: %d건", len(newly_completed))

    for campaign in newly_completed:
        code = campaign["campaign_code"]
        brand = campaign.get("brand_name", "")
        logger.info("리뷰 생성 중: %s (%s)", code, brand)

        try:
            posts_res = (
                sb.table("campaign_posts")
                .select("*")
                .eq("campaign_code", code)
                .execute()
            )
            posts = posts_res.data or []

            kpis = calculate_campaign_kpis(posts, campaign)
            prompt = build_completion_review_prompt(kpis, campaign)
            review_text = generate_review(prompt)

            notion_title = f"[완료 리뷰] {brand} — {code}"
            page_id = create_notion_review_page(
                review_type="completion",
                title=notion_title,
                content=review_text,
                action_items=[],
            )
            logger.info("Notion 페이지 생성 완료: %s", page_id)

            notify_slack_review(
                title=notion_title,
                summary=review_text[:300] + ("..." if len(review_text) > 300 else ""),
                review_type="completion",
            )

            sb.table("campaign_reviews").insert({
                "campaign_code": code,
                "review_type": "completion",
                "notion_page_id": page_id,
            }).execute()
            logger.info("campaign_reviews 저장 완료: %s", code)

        except Exception as exc:
            logger.error("리뷰 생성 실패 (%s): %s", code, exc)

    logger.info("수집 파이프라인 완료")
    notify_slack("캠페인 플라이휠 수집", "success", f"신규 {len(new_entries)}건, 재무 {written_fin}건, 회고 {len(newly_completed)}건")


if __name__ == "__main__":
    wait_for_network()
    ping_healthcheck("start")
    try:
        main()
        ping_healthcheck("success")
    except Exception as exc:
        import traceback
        tb = traceback.format_exc()
        logger.error("[FATAL] %s\n%s", exc, tb)
        notify_slack("캠페인 플라이휠 수집", "fail", f"{exc}\n{tb[:500]}")
        ping_healthcheck("fail", str(exc))
        sys.exit(1)
