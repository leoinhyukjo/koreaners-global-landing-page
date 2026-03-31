"""캠페인 리뷰 생성 모듈

수집된 캠페인 포스트 데이터와 재무 정보를 바탕으로
Claude API로 한국어 리뷰를 생성하고 Notion + Slack에 전달합니다.
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any

# shared-env 경로 추가 (krns_automation 모듈 접근)
_shared_env_path = os.path.join(os.path.dirname(__file__), "..", "..", "shared-env")
sys.path.insert(0, _shared_env_path)


# ---------------------------------------------------------------------------
# KPI 계산
# ---------------------------------------------------------------------------

def calculate_campaign_kpis(posts: list[dict], financials: dict) -> dict:
    """캠페인 포스트 목록과 재무 데이터로 KPI를 집계합니다.

    Args:
        posts: 캠페인 포스트 딕셔너리 리스트
            각 항목: ig_handle, creator_name, views, likes, shares, comments
        financials: 재무 데이터 딕셔너리
            contract_amount_krw, margin_krw

    Returns:
        집계된 KPI 딕셔너리
    """
    total_views = sum(p.get("views", 0) for p in posts)
    total_likes = sum(p.get("likes", 0) for p in posts)
    total_shares = sum(p.get("shares", 0) for p in posts)
    total_comments = sum(p.get("comments", 0) for p in posts)
    total_engagement = total_likes + total_shares + total_comments

    contract_amount = financials.get("contract_amount_krw", 0) or 0
    margin_krw = financials.get("margin_krw", 0) or 0

    # ZeroDivisionError 방지
    avg_engagement_rate = (total_engagement / total_views * 100) if total_views > 0 else 0
    cpv = (contract_amount / total_views) if total_views > 0 else 0
    cpe = (contract_amount / total_engagement) if total_engagement > 0 else 0
    margin_rate = (margin_krw / contract_amount * 100) if contract_amount > 0 else 0

    # 크리에이터별 집계 (ig_handle 기준, 없으면 creator_name)
    creator_map: dict[str, dict] = {}
    for p in posts:
        key = p.get("ig_handle") or p.get("creator_name", "unknown")
        if key not in creator_map:
            creator_map[key] = {
                "ig_handle": p.get("ig_handle"),
                "creator_name": p.get("creator_name", ""),
                "views": 0,
                "likes": 0,
                "shares": 0,
                "comments": 0,
                "total_engagement": 0,
            }
        entry = creator_map[key]
        entry["views"] += p.get("views", 0)
        entry["likes"] += p.get("likes", 0)
        entry["shares"] += p.get("shares", 0)
        entry["comments"] += p.get("comments", 0)
        entry["total_engagement"] += (
            p.get("likes", 0) + p.get("shares", 0) + p.get("comments", 0)
        )

    creators_sorted = sorted(creator_map.values(), key=lambda c: c["views"], reverse=True)
    creator_count = len(creators_sorted)

    top_creators = creators_sorted[:3]
    # bottom_creators: 크리에이터가 3명 초과일 때만, 하위 3명을 뷰 오름차순으로
    if creator_count > 3:
        bottom_creators = list(reversed(creators_sorted[-3:]))
    else:
        bottom_creators = []

    return {
        "total_views": total_views,
        "total_likes": total_likes,
        "total_shares": total_shares,
        "total_comments": total_comments,
        "total_engagement": total_engagement,
        "avg_engagement_rate": avg_engagement_rate,
        "cpv": cpv,
        "cpe": cpe,
        "margin_rate": margin_rate,
        "top_creators": top_creators,
        "bottom_creators": bottom_creators,
        "creator_count": creator_count,
    }


# ---------------------------------------------------------------------------
# 프롬프트 빌더
# ---------------------------------------------------------------------------

def build_completion_review_prompt(kpis: dict, campaign: dict) -> str:
    """캠페인 완료 리뷰용 Claude 프롬프트를 생성합니다.

    Args:
        kpis: calculate_campaign_kpis 반환값
        campaign: 캠페인 기본 정보 (brand_name, campaign_code, contract_amount_krw, margin_krw)

    Returns:
        Claude API에 전달할 한국어 프롬프트 문자열
    """
    brand_name = campaign.get("brand_name", "")
    campaign_code = campaign.get("campaign_code", "")
    contract_amount = campaign.get("contract_amount_krw", 0) or 0
    margin_krw = campaign.get("margin_krw", 0) or 0

    top_json = json.dumps(kpis.get("top_creators", []), ensure_ascii=False, indent=2)
    bottom_json = json.dumps(kpis.get("bottom_creators", []), ensure_ascii=False, indent=2)

    prompt = f"""아래 캠페인 데이터를 바탕으로 완료 리뷰를 작성해 주세요.

## 캠페인 정보
- 브랜드명: {brand_name}
- 캠페인 코드: {campaign_code}
- 계약 금액: {contract_amount:,}원
- 마진: {margin_krw:,}원

## 성과 KPI
- 총 조회수: {kpis['total_views']:,}
- 총 좋아요: {kpis['total_likes']:,}
- 총 공유: {kpis['total_shares']:,}
- 총 댓글: {kpis['total_comments']:,}
- 총 인게이지먼트: {kpis['total_engagement']:,}
- 평균 인게이지먼트율: {kpis['avg_engagement_rate']:.2f}%
- CPV (조회당 비용): {kpis['cpv']:,.2f}원
- CPE (인게이지먼트당 비용): {kpis['cpe']:,.2f}원
- 마진율: {kpis['margin_rate']:.1f}%
- 참여 크리에이터 수: {kpis['creator_count']}명

## Top 크리에이터 (뷰 기준 상위 3명)
{top_json}

## Bottom 크리에이터 (뷰 기준 하위 3명, 4명 이상인 경우)
{bottom_json}

---

위 데이터를 바탕으로 다음 4가지를 작성해 주세요:

1. 성과 요약: 이번 캠페인 전반적인 성과를 2-3문장으로 요약
2. 비용 효율: CPV, CPE, 마진율 기준으로 비용 효율 평가
3. Top/Bottom 분석: 상위 크리에이터와 하위 크리에이터의 성과 차이 원인 분석
4. 다음 캠페인 제안: 구체적인 액션아이템 3-5개

마크다운 금지. 평서문으로 작성. 숫자에는 천단위 콤마 사용."""

    return prompt


def build_periodic_review_prompt(summary: dict) -> str:
    """격주 정기 비즈니스 리뷰용 Claude 프롬프트를 생성합니다.

    Args:
        summary: 정기 리뷰 요약 딕셔너리
            period_start, period_end, total_campaigns, active_campaigns,
            total_contract_krw, total_margin_krw, prev_period (dict),
            creator_pool_stats (dict), brand_stats (dict)

    Returns:
        Claude API에 전달할 한국어 프롬프트 문자열
    """
    period_start = summary.get("period_start", "")
    period_end = summary.get("period_end", "")
    total_campaigns = summary.get("total_campaigns", 0)
    active_campaigns = summary.get("active_campaigns", 0)
    total_contract = summary.get("total_contract_krw", 0) or 0
    total_margin = summary.get("total_margin_krw", 0) or 0

    prev = summary.get("prev_period", {}) or {}
    prev_campaigns = prev.get("total_campaigns", 0)
    prev_contract = prev.get("total_contract_krw", 0) or 0
    prev_margin = prev.get("total_margin_krw", 0) or 0

    creator_stats = summary.get("creator_pool_stats", {}) or {}
    creator_total = creator_stats.get("total", 0)
    creator_new = creator_stats.get("new", 0)

    brand_stats = summary.get("brand_stats", {}) or {}
    brand_total = brand_stats.get("total", 0)
    brand_returning = brand_stats.get("returning", 0)

    # 전기 대비 증감
    contract_diff = total_contract - prev_contract
    contract_diff_str = f"+{contract_diff:,}" if contract_diff >= 0 else f"{contract_diff:,}"
    campaign_diff = total_campaigns - prev_campaigns
    campaign_diff_str = f"+{campaign_diff}" if campaign_diff >= 0 else str(campaign_diff)

    prompt = f"""아래 데이터를 바탕으로 {period_start} ~ {period_end} 기간의 정기 비즈니스 리뷰를 작성해 주세요.

## 기간 개요
- 기간: {period_start} ~ {period_end}
- 총 캠페인 수: {total_campaigns}건
- 진행 중 캠페인: {active_campaigns}건
- 총 계약 금액: {total_contract:,}원
- 총 마진: {total_margin:,}원

## 전기 대비 비교
- 이전 기간 캠페인 수: {prev_campaigns}건 (변화: {campaign_diff_str}건)
- 이전 기간 계약 금액: {prev_contract:,}원 (변화: {contract_diff_str}원)
- 이전 기간 마진: {prev_margin:,}원

## 크리에이터 풀
- 총 크리에이터 수: {creator_total}명
- 신규 크리에이터: {creator_new}명

## 브랜드 현황
- 총 브랜드 수: {brand_total}개
- 리텐션 브랜드 (재계약): {brand_returning}개

---

위 데이터를 바탕으로 다음 6가지를 작성해 주세요:

1. 핵심 요약: 이번 기간 비즈니스 현황을 2-3문장으로 요약
2. 파이프라인 현황: 진행 중 캠페인과 예상 매출 전망
3. 기간 비교: 전기 대비 성장 또는 감소 요인 분석
4. 크리에이터 풀: 신규 유입 트렌드 및 풀 건전성 평가
5. 브랜드 리텐션: 재계약률과 고객 충성도 평가
6. 액션아이템: 다음 2주 내 실행할 구체적인 액션아이템 3-5개

마크다운 금지. 평서문으로 작성. 숫자에는 천단위 콤마 사용."""

    return prompt


# ---------------------------------------------------------------------------
# Claude API 호출
# ---------------------------------------------------------------------------

def generate_review(prompt: str) -> str:
    """Claude API를 호출하여 리뷰 텍스트를 생성합니다.

    Args:
        prompt: Claude에 전달할 프롬프트 문자열

    Returns:
        생성된 리뷰 텍스트
    """
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


# ---------------------------------------------------------------------------
# Notion 페이지 생성
# ---------------------------------------------------------------------------

def create_notion_review_page(
    review_type: str,
    title: str,
    content: str,
    action_items: list[str],
) -> str:
    """Notion에 리뷰 페이지를 생성합니다.

    Args:
        review_type: 리뷰 유형 ("completion" 또는 "periodic")
        title: 페이지 제목
        content: 리뷰 본문 텍스트
        action_items: 액션아이템 리스트 (to_do 블록으로 생성)

    Returns:
        생성된 Notion 페이지 ID
    """
    from notion_client import Client

    notion = Client(auth=os.environ.get("NOTION_TOKEN"))
    db_id = os.environ.get("NOTION_REVIEW_DB_ID", "")

    # 본문 단락 블록
    children: list[dict] = [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": content},
                    }
                ]
            },
        }
    ]

    # 액션아이템 to_do 블록
    for item in action_items:
        children.append(
            {
                "object": "block",
                "type": "to_do",
                "to_do": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {"content": item},
                        }
                    ],
                    "checked": False,
                },
            }
        )

    response = notion.pages.create(
        parent={"database_id": db_id},
        properties={
            "이름": {
                "title": [
                    {
                        "type": "text",
                        "text": {"content": title},
                    }
                ]
            }
        },
        children=children,
    )

    return response["id"]


# ---------------------------------------------------------------------------
# Slack 알림
# ---------------------------------------------------------------------------

def notify_slack_review(title: str, summary: str, review_type: str) -> None:
    """Slack으로 리뷰 알림을 전송합니다.

    Args:
        title: 알림 제목
        summary: 알림 요약 텍스트
        review_type: "periodic" → 📊, "completion" → ✅
    """
    try:
        from krns_automation import notify_slack
    except ImportError:
        return

    emoji = "📊" if review_type == "periodic" else "✅"
    message = f"{emoji} *{title}*\n{summary}"
    notify_slack(message)
