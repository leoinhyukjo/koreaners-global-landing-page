#!/usr/bin/env python3
"""캠페인 플라이휠 — 정기 비즈니스 리뷰 엔트리포인트 (격주 월 09:00)

Flow:
  1. 격주 가드: 마지막 periodic 리뷰 < 14일이면 스킵
  2. 당기(14일) + 전기(이전 14일) 데이터 집계
  3. 요약 dict 구성 → Claude 리뷰 생성 → Notion 페이지 → Slack 알림
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime, timedelta, timezone
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

# 진행 중으로 간주할 상태 목록
ACTIVE_STATUSES = {"섭외 중", "운영 중", "인플루언서 정산 중", "클라이언트 정산 중"}


def _date_str(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def main() -> None:
    import os
    import supabase as supabase_lib
    from review_generator import (
        build_periodic_review_prompt,
        generate_review,
        notify_slack_review,
    )
    from config import REVIEW_PERIODIC_DAYS

    logger.info("=" * 60)
    logger.info("캠페인 플라이휠 정기 리뷰 파이프라인 시작")
    logger.info("실행: %s", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    logger.info("=" * 60)

    sb = supabase_lib.create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    # ── 격주 가드 ──
    last_review_res = (
        sb.table("campaign_reviews")
        .select("created_at")
        .eq("review_type", "periodic")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if last_review_res.data:
        last_ts_str = last_review_res.data[0]["created_at"]
        # ISO 8601 파싱 (Z suffix 대응)
        last_ts_str = last_ts_str.replace("Z", "+00:00")
        last_ts = datetime.fromisoformat(last_ts_str)
        days_since = (datetime.now(tz=timezone.utc) - last_ts).days
        if days_since < REVIEW_PERIODIC_DAYS:
            logger.info(
                "마지막 periodic 리뷰로부터 %d일 경과 (기준 %d일) — 스킵",
                days_since,
                REVIEW_PERIODIC_DAYS,
            )
            return
        logger.info("마지막 periodic 리뷰로부터 %d일 경과 — 리뷰 진행", days_since)
    else:
        logger.info("이전 periodic 리뷰 없음 — 최초 리뷰 진행")

    # ── 기간 계산 ──
    now = datetime.now(tz=timezone.utc)
    period_end = now
    period_start = now - timedelta(days=REVIEW_PERIODIC_DAYS)
    prev_period_start = period_start - timedelta(days=REVIEW_PERIODIC_DAYS)

    period_start_str = _date_str(period_start)
    period_end_str = _date_str(period_end)
    prev_start_str = _date_str(prev_period_start)

    logger.info("당기: %s ~ %s", period_start_str, period_end_str)
    logger.info("전기: %s ~ %s", prev_start_str, period_start_str)

    # ── 당기 재무 데이터 ──
    fin_res = (
        sb.table("campaign_financials")
        .select("campaign_code, status, brand_name, contract_amount_krw, margin_krw, start_date")
        .gte("start_date", period_start_str)
        .execute()
    )
    fin_records = fin_res.data or []

    total_campaigns = len(fin_records)
    active_campaigns = sum(1 for r in fin_records if r.get("status") in ACTIVE_STATUSES)
    total_contract_krw = sum((r.get("contract_amount_krw") or 0) for r in fin_records)
    total_margin_krw = sum((r.get("margin_krw") or 0) for r in fin_records)

    # ── 전기 재무 데이터 ──
    prev_fin_res = (
        sb.table("campaign_financials")
        .select("campaign_code, contract_amount_krw, margin_krw, start_date")
        .gte("start_date", prev_start_str)
        .lt("start_date", period_start_str)
        .execute()
    )
    prev_records = prev_fin_res.data or []
    prev_total_campaigns = len(prev_records)
    prev_total_contract = sum((r.get("contract_amount_krw") or 0) for r in prev_records)
    prev_total_margin = sum((r.get("margin_krw") or 0) for r in prev_records)

    # ── 크리에이터 통계 ──
    posts_res = (
        sb.table("campaign_posts")
        .select("ig_handle, creator_name, collected_at")
        .gte("collected_at", period_start_str)
        .execute()
    )
    posts = posts_res.data or []

    current_creators: set[str] = {
        p.get("ig_handle") or p.get("creator_name", "") for p in posts if p.get("ig_handle") or p.get("creator_name")
    }

    prev_posts_res = (
        sb.table("campaign_posts")
        .select("ig_handle, creator_name")
        .lt("collected_at", period_start_str)
        .execute()
    )
    prev_creators: set[str] = {
        p.get("ig_handle") or p.get("creator_name", "")
        for p in (prev_posts_res.data or [])
        if p.get("ig_handle") or p.get("creator_name")
    }

    new_creators = current_creators - prev_creators
    returning_creators = current_creators & prev_creators

    # ── 브랜드 통계 ──
    current_brands: set[str] = {r.get("brand_name", "") for r in fin_records if r.get("brand_name")}
    prev_brands: set[str] = {r.get("brand_name", "") for r in prev_records if r.get("brand_name")}
    returning_brands = current_brands & prev_brands

    # ── 요약 dict 구성 ──
    summary = {
        "period_start": period_start_str,
        "period_end": period_end_str,
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_contract_krw": total_contract_krw,
        "total_margin_krw": total_margin_krw,
        "prev_period": {
            "total_campaigns": prev_total_campaigns,
            "total_contract_krw": prev_total_contract,
            "total_margin_krw": prev_total_margin,
        },
        "creator_pool_stats": {
            "total": len(current_creators),
            "new": len(new_creators),
            "returning": len(returning_creators),
        },
        "brand_stats": {
            "total": len(current_brands),
            "new": len(current_brands - prev_brands),
            "returning": len(returning_brands),
        },
    }

    logger.info(
        "요약: 캠페인 %d건(활성 %d), 계약 %s원, 마진 %s원",
        total_campaigns,
        active_campaigns,
        f"{total_contract_krw:,}",
        f"{total_margin_krw:,}",
    )

    # ── 리뷰 생성 ──
    prompt = build_periodic_review_prompt(summary)
    review_text = generate_review(prompt)
    logger.info("Claude 리뷰 생성 완료 (%d자)", len(review_text))

    title = f"[정기 리뷰] {period_start_str} ~ {period_end_str}"

    # ── Slack 알림 ──
    notify_slack_review(
        title=title,
        summary=review_text[:500],
        review_type="periodic",
    )

    # ── campaign_reviews 저장 ──
    sb.table("campaign_reviews").insert({
        "review_type": "periodic",
        "period_start": period_start_str,
        "period_end": period_end_str,
        "insights_json": {"text": review_text, "summary": summary},
    }).execute()
    logger.info("campaign_reviews 저장 완료")

    logger.info("정기 리뷰 파이프라인 완료")
    notify_slack("캠페인 정기 리뷰", "success", f"{period_start_str} ~ {period_end_str}")


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
        notify_slack("캠페인 정기 리뷰", "fail", f"{exc}\n{tb[:500]}")
        ping_healthcheck("fail", str(exc))
        sys.exit(1)
