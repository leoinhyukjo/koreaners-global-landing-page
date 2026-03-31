"""sheet_scanner 테스트"""
from __future__ import annotations

import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# campaign-flywheel 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sheet_scanner import extract_ig_urls_from_rows, scan_all_sheets, _extract_brand_from_filename


# 실제 PM 시트 헤더 샘플
# 녹십자웰빙: 업로드 링크 = 칼럼 12 (0-based)
NOKCHIPSA_HEADERS = [
    "회차", "국가", "", "이름", "ID", "팔로워", "평균 조회수",
    "진행 상황", "클리닉", "방문 일자", "제품", "업로드 일자", "업로드 링크"
]
# 트리밍버드: IG ID=1, NAME=2, URL=4 (0-based)
TRIMBIRD_HEADERS = [
    "사진5", "IG ID", "NAME", "IG FW", "URL",
    "진행 금액", "진행 내용", "진행 형태", "방문 가능 일", "인터뷰 가능 여부", "업로드 링크"
]


class TestExtractIgUrlsFindsReelUrls(unittest.TestCase):
    """릴스 URL을 정상적으로 추출하는지 확인"""

    def test_extract_ig_urls_finds_reel_urls(self):
        rows = [
            NOKCHIPSA_HEADERS,
            ["1", "JP", "", "야마다 하나코", "@yamada_hanako", "15000", "3000",
             "완료", "강남", "2024-01-10", "제품A", "2024-01-20",
             "https://www.instagram.com/reel/ABC123xyz/"],
        ]
        results = extract_ig_urls_from_rows(rows, "녹십자웰빙", "sheet_id_001")

        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["brand_name"], "녹십자웰빙")
        self.assertEqual(result["post_url"], "https://www.instagram.com/reel/ABC123xyz/")
        self.assertEqual(result["post_type"], "reels")
        self.assertEqual(result["source_sheet_id"], "sheet_id_001")
        self.assertEqual(result["ig_handle"], "@yamada_hanako")


class TestExtractIgUrlsFindsPostUrls(unittest.TestCase):
    """/p/ URL을 post_type 'feed'로 추출하는지 확인"""

    def test_extract_ig_urls_finds_post_urls(self):
        rows = [
            TRIMBIRD_HEADERS,
            ["사진.jpg", "@trimbird_user", "田中 花子", "8500",
             "https://instagram.com/p/XYZ789abc/",
             "300000", "체험", "피드", "2024-02-01", "가능", ""],
        ]
        results = extract_ig_urls_from_rows(rows, "트리밍버드", "sheet_id_002")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["post_type"], "feed")
        self.assertEqual(results[0]["post_url"], "https://instagram.com/p/XYZ789abc/")
        self.assertEqual(results[0]["ig_handle"], "@trimbird_user")
        self.assertEqual(results[0]["creator_name"], "田中 花子")


class TestExtractIgUrlsSkipsProfileUrls(unittest.TestCase):
    """프로필 URL은 추출 대상에서 제외하는지 확인"""

    def test_extract_ig_urls_skips_profile_urls(self):
        rows = [
            ["이름", "IG 프로필", "업로드 링크"],
            ["홍길동", "https://www.instagram.com/honggildong/", ""],
            ["김철수", "https://instagram.com/kimcheolsu", ""],
        ]
        results = extract_ig_urls_from_rows(rows, "테스트브랜드", "sheet_id_003")

        self.assertEqual(results, [])


class TestExtractIgUrlsHandlesEmptyRows(unittest.TestCase):
    """빈 데이터 입력 시 빈 리스트를 반환하는지 확인"""

    def test_extract_ig_urls_handles_empty_rows(self):
        self.assertEqual(extract_ig_urls_from_rows([], "브랜드", "sheet_id"), [])
        self.assertEqual(extract_ig_urls_from_rows([[]], "브랜드", "sheet_id"), [])


class TestExtractCreatorInfoFromAdjacentColumns(unittest.TestCase):
    """URL 왼쪽 칼럼에서 IG 핸들 및 이름을 추출하는지 확인 (트리밍버드 구조)"""

    def test_extract_creator_info_from_adjacent_columns(self):
        # 트리밍버드: IG ID(1), NAME(2), URL(4)
        rows = [
            TRIMBIRD_HEADERS,
            ["사진.jpg", "@sakura_beauty", "佐藤 さくら", "22000",
             "https://www.instagram.com/reel/TRIMBIRD001/",
             "500000", "체험", "릴스", "2024-03-05", "가능", ""],
        ]
        results = extract_ig_urls_from_rows(rows, "트리밍버드", "sheet_id_004")

        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertEqual(result["ig_handle"], "@sakura_beauty")
        self.assertEqual(result["creator_name"], "佐藤 さくら")


class TestScanAllSheetsDeduplicates(unittest.TestCase):
    """동일 시트 내 중복 URL은 1건만 수집하는지 확인"""

    def test_scan_all_sheets_deduplicates(self):
        mock_client = MagicMock()
        mock_client.list_drive_sheets.return_value = [
            {"id": "sheet_dup", "name": "[KOREANERS] 녹십자웰빙 인플루언서 리스트"}
        ]
        mock_client.get_sheet_tabs.return_value = ["Sheet1"]
        # 같은 URL이 두 행에 존재
        duplicate_url = "https://www.instagram.com/reel/DUP001xyz/"
        mock_client.read_tab.return_value = [
            ["이름", "ID", "링크"],
            ["크리에이터A", "@creator_a", duplicate_url],
            ["크리에이터A", "@creator_a", duplicate_url],
        ]

        results = scan_all_sheets(mock_client, set())

        # 중복 제거 후 1건만
        urls = [r["post_url"] for r in results]
        self.assertEqual(urls.count(duplicate_url), 1)


class TestScanAllSheetsSkipsExistingUrls(unittest.TestCase):
    """existing_urls에 이미 있는 URL은 건너뛰는지 확인"""

    def test_scan_all_sheets_skips_existing_urls(self):
        mock_client = MagicMock()
        mock_client.list_drive_sheets.return_value = [
            {"id": "sheet_exist", "name": "[KOREANERS] 온리프 진행"}
        ]
        mock_client.get_sheet_tabs.return_value = ["Sheet1"]
        existing_url = "https://www.instagram.com/reel/EXISTING001/"
        mock_client.read_tab.return_value = [
            ["이름", "ID", "링크"],
            ["기존크리에이터", "@existing_creator", existing_url],
        ]

        results = scan_all_sheets(mock_client, {existing_url})

        # 이미 존재하는 URL이므로 결과 없음
        self.assertEqual(results, [])


if __name__ == "__main__":
    unittest.main()
