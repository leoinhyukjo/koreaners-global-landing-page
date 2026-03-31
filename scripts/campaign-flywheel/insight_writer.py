"""인사이트 탭 + Supabase 기록 모듈

수집된 entry dict를 Google Sheets insight 탭과 campaign_posts 테이블에 기록합니다.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from config import MKT_OPS_MASTER_SHEET_ID, INSIGHT_TAB
from sheets_client import SheetsClient

# Insight 탭 컬럼 순서
# ['', 날짜, 인플루언서닉네임, 카테고리, 브랜드명, 유형, 뷰, 좋아요, 공유, 댓글]
_INSIGHT_COLUMNS = [
    "",           # 0: 빈 컬럼
    "날짜",        # 1: YYYY-MM-DD (UTC)
    "인플루언서닉네임",  # 2: ig_handle or creator_name
    "카테고리",      # 3: 미래 매핑용 (현재 빈 문자열)
    "브랜드명",      # 4: brand_name
    "유형",         # 5: post_type
    "뷰",           # 6: views
    "좋아요",        # 7: likes
    "공유",          # 8: shares
    "댓글",          # 9: comments
]


def format_insight_row(entry: dict) -> list:
    """entry dict를 insight 탭 row 형식(10개 원소 리스트)으로 변환합니다.

    Insight 탭 컬럼:
        ['', 날짜, 인플루언서닉네임, 카테고리, 브랜드명, 유형, 뷰, 좋아요, 공유, 댓글]

    Args:
        entry: 수집된 캠페인 포스트 데이터 딕셔너리

    Returns:
        10개 원소 리스트
    """
    today = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")

    ig_handle = entry.get("ig_handle")
    nickname = ig_handle if ig_handle else entry.get("creator_name", "")

    return [
        "",                              # 0: 빈 컬럼
        today,                           # 1: 날짜
        nickname,                        # 2: 인플루언서닉네임
        "",                              # 3: 카테고리 (미래 매핑용)
        entry.get("brand_name", ""),     # 4: 브랜드명
        entry.get("post_type", ""),      # 5: 유형
        entry.get("views", 0),           # 6: 뷰
        entry.get("likes", 0),           # 7: 좋아요
        entry.get("shares", 0),          # 8: 공유
        entry.get("comments", 0),        # 9: 댓글
    ]


def write_to_insight_tab(client: SheetsClient, entries: list[dict]) -> int:
    """모든 entry를 insight 탭에 추가합니다.

    Args:
        client: SheetsClient 인스턴스
        entries: 기록할 entry 딕셔너리 리스트

    Returns:
        추가된 행 수. entries가 빈 리스트면 0 반환.
    """
    if not entries:
        return 0

    rows = [format_insight_row(entry) for entry in entries]
    return client.append_rows(MKT_OPS_MASTER_SHEET_ID, INSIGHT_TAB, rows)


def write_to_supabase(
    supabase_client: Any, entries: list[dict], batch_size: int = 50
) -> int:
    """entry 리스트를 campaign_posts 테이블에 upsert합니다.

    post_url을 UNIQUE constraint 기준으로 upsert 처리합니다.
    배치 단위로 처리하여 대용량 데이터에 대응합니다.

    Args:
        supabase_client: supabase-py 클라이언트 인스턴스
        entries: 기록할 entry 딕셔너리 리스트
        batch_size: 배치당 처리 행 수 (기본값 50)

    Returns:
        총 upsert된 행 수
    """
    if not entries:
        return 0

    total = 0
    for i in range(0, len(entries), batch_size):
        batch = entries[i : i + batch_size]
        records = [
            {
                "brand_name": e.get("brand_name"),
                "creator_name": e.get("creator_name"),
                "ig_handle": e.get("ig_handle"),
                "post_url": e.get("post_url"),
                "post_type": e.get("post_type"),
                "views": e.get("views", 0),
                "likes": e.get("likes", 0),
                "shares": e.get("shares", 0),
                "comments": e.get("comments", 0),
                "collected_at": e.get("collected_at"),
                "source_sheet_id": e.get("source_sheet_id"),
                "campaign_code": e.get("campaign_code"),
            }
            for e in batch
        ]
        supabase_client.table("campaign_posts").upsert(
            records, on_conflict="post_url"
        ).execute()
        total += len(batch)

    return total


def write_financials_to_supabase(
    supabase_client: Any, records: list[dict], batch_size: int = 50
) -> int:
    """재무 레코드를 campaign_financials 테이블에 upsert합니다.

    campaign_code를 UNIQUE constraint 기준으로 upsert 처리합니다.

    Args:
        supabase_client: supabase-py 클라이언트 인스턴스
        records: 기록할 재무 데이터 딕셔너리 리스트
        batch_size: 배치당 처리 행 수 (기본값 50)

    Returns:
        총 upsert된 행 수
    """
    if not records:
        return 0

    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        supabase_client.table("campaign_financials").upsert(
            batch, on_conflict="campaign_code"
        ).execute()
        total += len(batch)

    return total
