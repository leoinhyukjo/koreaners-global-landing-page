"""Dashboard ETL — MKT Ops Master Dashboard 탭 파싱 및 Supabase 업로드용 변환"""
from __future__ import annotations

import re
from typing import Optional

from config import DashboardCol, COMPLETION_STATUS


# ---------------------------------------------------------------------------
# 내부 헬퍼
# ---------------------------------------------------------------------------

def _safe_get(row: list, idx: int) -> str:
    """안전한 인덱스 접근 — 범위 초과 시 빈 문자열 반환"""
    try:
        return str(row[idx]).strip()
    except (IndexError, TypeError):
        return ""


# ---------------------------------------------------------------------------
# 파서
# ---------------------------------------------------------------------------

def parse_money(raw: str | None) -> float:
    """통화 문자열 → float 변환

    Examples:
        '₩17,878,863' → 17878863.0
        '¥460,000'    → 460000.0
        ''            → 0.0
        None          → 0.0
    """
    if not raw:
        return 0.0
    # ₩, ¥, $, 콤마, 공백 제거
    cleaned = re.sub(r"[₩¥$,\s]", "", raw)
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_date(raw: str | None) -> Optional[str]:
    """한국식 날짜 문자열 → ISO 8601 변환

    Examples:
        '2026. 1. 12' → '2026-01-12'
        '2026. 3. 6'  → '2026-03-06'
        ''            → None
        None          → None
    """
    if not raw:
        return None
    m = re.search(r"(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})", raw)
    if not m:
        return None
    year, month, day = m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)
    return f"{year}-{month}-{day}"


# ---------------------------------------------------------------------------
# 행 파서
# ---------------------------------------------------------------------------

def parse_dashboard_row(row: list) -> dict | None:
    """Dashboard 탭 단일 행 → dict 변환

    campaign_code 또는 brand_name 이 비어 있으면 None 반환.
    """
    campaign_code = _safe_get(row, DashboardCol.CODE)
    brand_name = _safe_get(row, DashboardCol.BRAND_NAME)

    if not campaign_code or not brand_name:
        return None

    return {
        "campaign_code":      campaign_code,
        "company_name":       _safe_get(row, DashboardCol.COMPANY_NAME),
        "brand_name":         brand_name,
        "campaign_type":      _safe_get(row, DashboardCol.CAMPAIGN_TYPE),
        "media":              _safe_get(row, DashboardCol.MEDIA),
        "contract_amount_krw": parse_money(_safe_get(row, DashboardCol.CONTRACT_KRW)),
        "contract_amount_jpy": parse_money(_safe_get(row, DashboardCol.CONTRACT_JPY)),
        "contract_amount_usd": parse_money(_safe_get(row, DashboardCol.CONTRACT_USD)),
        "cost_krw":           parse_money(_safe_get(row, DashboardCol.COST_KRW)),
        "cost_jpy":           parse_money(_safe_get(row, DashboardCol.COST_JPY)),
        "margin_krw":         parse_money(_safe_get(row, DashboardCol.MARGIN_KRW)),
        "status":             _safe_get(row, DashboardCol.STATUS),
        "start_date":         parse_date(_safe_get(row, DashboardCol.START_DATE)),
        "end_date":           parse_date(_safe_get(row, DashboardCol.END_DATE)),
        "pm_primary":         _safe_get(row, DashboardCol.PM_PRIMARY),
        "pm_secondary":       _safe_get(row, DashboardCol.PM_SECONDARY),
    }


def parse_all_dashboard_rows(rows: list[list]) -> list[dict]:
    """Dashboard 탭 전체 행 처리 (헤더 row[0] 스킵)

    Args:
        rows: 시트에서 읽어온 2D 리스트 (첫 번째 행 = 헤더)

    Returns:
        파싱된 레코드 리스트 (None 제외)
    """
    records = []
    for row in rows[1:]:  # 헤더 스킵
        record = parse_dashboard_row(row)
        if record is not None:
            records.append(record)
    return records


# ---------------------------------------------------------------------------
# 완료 감지
# ---------------------------------------------------------------------------

def detect_newly_completed(
    records: list[dict],
    already_reviewed: set[str],
) -> list[dict]:
    """status == COMPLETION_STATUS 이고 아직 리뷰되지 않은 레코드 반환

    Args:
        records:          parse_all_dashboard_rows() 결과
        already_reviewed: 이미 리뷰된 campaign_code 집합

    Returns:
        신규 완료 레코드 리스트
    """
    return [
        r for r in records
        if r["status"] == COMPLETION_STATUS
        and r["campaign_code"] not in already_reviewed
    ]
