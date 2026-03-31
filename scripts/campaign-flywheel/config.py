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
APIFY_MAX_ITEMS = 1

# Instagram URL 패턴
IG_URL_PATTERN = r"https?://(?:www\.)?instagram\.com/(?:reel|p|stories)/[\w\-/]+"

# 리뷰
COMPLETION_STATUS = "진행 완료"
REVIEW_PERIODIC_DAYS = 14

# 로그
LOG_DIR = Path.home() / "logs"
LOG_FILE = LOG_DIR / "campaign-flywheel.log"
