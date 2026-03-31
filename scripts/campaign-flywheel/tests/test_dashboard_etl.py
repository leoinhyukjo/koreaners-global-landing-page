"""Dashboard ETL 유닛 테스트"""
from __future__ import annotations

import sys
import os

# campaign-flywheel 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from dashboard_etl import (
    parse_money,
    parse_date,
    parse_dashboard_row,
    parse_all_dashboard_rows,
    detect_newly_completed,
)


# ---------------------------------------------------------------------------
# parse_money
# ---------------------------------------------------------------------------

def test_parse_money_krw():
    assert parse_money("₩17,878,863") == 17878863.0


def test_parse_money_jpy():
    assert parse_money("¥460,000") == 460000.0


def test_parse_money_empty():
    assert parse_money("") == 0.0
    assert parse_money(None) == 0.0


# ---------------------------------------------------------------------------
# parse_date
# ---------------------------------------------------------------------------

def test_parse_date_korean_format():
    assert parse_date("2026. 1. 12") == "2026-01-12"
    assert parse_date("2026. 3. 6") == "2026-03-06"


def test_parse_date_empty():
    assert parse_date("") is None
    assert parse_date(None) is None


# ---------------------------------------------------------------------------
# parse_dashboard_row
# ---------------------------------------------------------------------------

# Real sample row (indices align with DashboardCol)
SAMPLE_ROW = [
    "2026-03-16 월",           # 0  DATE
    "2026-12W",                # 1  DATE_YW
    "2026-12W/방문건/밭 주식회사/감자밭",  # 2  CODE
    "밭 주식회사",              # 3  COMPANY_NAME
    "감자밭",                  # 4  BRAND_NAME
    "클라이언트 정산 중",       # 5  STATUS
    "방문건",                  # 6  CAMPAIGN_TYPE
    "IG reels",                # 7  MEDIA
    "링크",                    # 8  OPERATION_SHEET
    "소희",                    # 9  PM_PRIMARY
    "사야카",                  # 10 PM_SECONDARY
    "2026. 1. 12",             # 11 START_DATE
    "2026. 1. 31",             # 12 END_DATE
    "수출바우처 메가 3명",      # 13 NOTE
    "",                        # 14 (empty)
    "₩17,878,863",             # 15 CONTRACT_KRW
    "",                        # 16 CONTRACT_JPY
    "",                        # 17 CONTRACT_USD
    "",                        # 18 COLLAB_FEE
    "₩7,000,000",              # 19 COST_KRW
    "¥460,000",                # 20 COST_JPY
    "6,514,483",               # 21 MARGIN_KRW
]


def test_parse_dashboard_row():
    record = parse_dashboard_row(SAMPLE_ROW)
    assert record is not None
    assert record["campaign_code"] == "2026-12W/방문건/밭 주식회사/감자밭"
    assert record["company_name"] == "밭 주식회사"
    assert record["brand_name"] == "감자밭"
    assert record["status"] == "클라이언트 정산 중"
    assert record["campaign_type"] == "방문건"
    assert record["media"] == "IG reels"
    assert record["pm_primary"] == "소희"
    assert record["pm_secondary"] == "사야카"
    assert record["start_date"] == "2026-01-12"
    assert record["end_date"] == "2026-01-31"
    assert record["contract_amount_krw"] == 17878863.0
    assert record["contract_amount_jpy"] == 0.0
    assert record["contract_amount_usd"] == 0.0
    assert record["cost_krw"] == 7000000.0
    assert record["cost_jpy"] == 460000.0
    assert record["margin_krw"] == 6514483.0


def test_parse_dashboard_row_skips_empty_code():
    row = list(SAMPLE_ROW)
    row[2] = ""  # empty campaign_code
    assert parse_dashboard_row(row) is None


# ---------------------------------------------------------------------------
# detect_newly_completed
# ---------------------------------------------------------------------------

def test_detect_newly_completed():
    records = [
        {"campaign_code": "A001", "status": "진행 완료"},
        {"campaign_code": "A002", "status": "진행 중"},
        {"campaign_code": "A003", "status": "진행 완료"},
        {"campaign_code": "A004", "status": "진행 완료"},
    ]
    already_reviewed = {"A001"}
    result = detect_newly_completed(records, already_reviewed)
    codes = [r["campaign_code"] for r in result]
    assert codes == ["A003", "A004"]
    assert "A001" not in codes  # already reviewed → excluded
    assert "A002" not in codes  # not completed → excluded
