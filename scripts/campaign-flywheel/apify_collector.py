"""Apify Instagram Post Scraper 연동 — 배치 성과 수집"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

from apify_client import ApifyClient

from config import APIFY_ACTOR_ID

logger = logging.getLogger(__name__)


def parse_apify_result(raw: dict) -> dict:
    """Apify Instagram Post Scraper 결과에서 핵심 지표 추출.

    Args:
        raw: Apify 응답 아이템 딕셔너리

    Returns:
        views, likes, shares, comments 4개 키를 가진 딕셔너리
    """
    # views: videoPlayCount 우선(릴스), 없으면 videoViewCount, 둘 다 없으면 0
    views = raw.get("videoPlayCount") or raw.get("videoViewCount") or 0
    likes = raw.get("likesCount") or 0
    shares = raw.get("sharesCount") or 0
    comments = raw.get("commentsCount") or 0

    return {
        "views": views,
        "likes": likes,
        "shares": shares,
        "comments": comments,
    }


def _normalize_url(url: str) -> str:
    """URL 끝 슬래시 제거 및 소문자 통일"""
    return url.rstrip("/").lower()


def _default_metrics() -> dict:
    """실패/누락 시 기본값 딕셔너리"""
    return {"views": 0, "likes": 0, "shares": 0, "comments": 0}


def collect_ig_metrics(
    entries: list[dict],
    batch_size: int = 25,
) -> list[dict]:
    """Sheet Scanner 엔트리 목록에서 Instagram 성과 지표를 Apify로 수집.

    Args:
        entries: post_url 키를 포함한 엔트리 딕셔너리 목록
        batch_size: 한 번에 Apify에 전송할 URL 수

    Returns:
        views/likes/shares/comments/collected_at 이 업데이트된 entries
    """
    api_token = os.environ.get("APIFY_API_TOKEN", "")
    client = ApifyClient(api_token)

    for batch_start in range(0, len(entries), batch_size):
        batch = entries[batch_start : batch_start + batch_size]
        urls = [e["post_url"] for e in batch]

        try:
            run = client.actor(APIFY_ACTOR_ID).call(
                run_input={
                    "directUrls": urls,
                    "resultsLimit": len(batch),
                }
            )
            dataset_id = run["defaultDatasetId"]
            items = client.dataset(dataset_id).list_items().items

            # URL → 지표 매핑 (정규화 키 사용)
            url_to_metrics: dict[str, dict] = {}
            for item in items:
                item_url = item.get("url", "")
                if item_url:
                    key = _normalize_url(item_url)
                    url_to_metrics[key] = parse_apify_result(item)

            # 각 엔트리에 매핑
            collected_at = datetime.now(timezone.utc).isoformat()
            for entry in batch:
                key = _normalize_url(entry["post_url"])
                if key in url_to_metrics:
                    entry.update(url_to_metrics[key])
                    entry["collected_at"] = collected_at
                else:
                    logger.warning("Apify 결과에서 URL 미매칭: %s", entry["post_url"])

        except Exception as exc:
            logger.error(
                "Apify 배치 실패 (batch_start=%d): %s", batch_start, exc, exc_info=True
            )
            for entry in batch:
                entry.update(_default_metrics())

    # collected_at 없는 엔트리(매칭 실패)에 기본값 설정
    for entry in entries:
        if "collected_at" not in entry:
            entry.update(_default_metrics())

    return entries
