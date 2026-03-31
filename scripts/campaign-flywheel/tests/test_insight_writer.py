"""insight_writer 테스트"""
from __future__ import annotations

import sys
import os
import unittest
from unittest.mock import MagicMock, call

# campaign-flywheel 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from insight_writer import format_insight_row, write_to_insight_tab, write_to_supabase


class TestFormatInsightRow(unittest.TestCase):
    """ig_handle이 있는 full entry → 올바른 row 반환"""

    def test_format_insight_row(self):
        entry = {
            "brand_name": "테스트브랜드",
            "creator_name": "홍길동",
            "ig_handle": "gildong_ig",
            "post_url": "https://www.instagram.com/reel/ABC123/",
            "post_type": "릴스",
            "views": 50000,
            "likes": 1200,
            "shares": 80,
            "comments": 45,
            "collected_at": "2026-03-30T00:00:00Z",
        }

        row = format_insight_row(entry)

        self.assertEqual(len(row), 10)
        # 첫 번째 컬럼은 빈 문자열
        self.assertEqual(row[0], "")
        # 날짜는 YYYY-MM-DD 포맷
        import re
        self.assertRegex(row[1], r"^\d{4}-\d{2}-\d{2}$")
        # ig_handle 사용
        self.assertEqual(row[2], "gildong_ig")
        # 카테고리는 빈 문자열
        self.assertEqual(row[3], "")
        # 브랜드명
        self.assertEqual(row[4], "테스트브랜드")
        # 유형
        self.assertEqual(row[5], "릴스")
        # 수치 확인
        self.assertEqual(row[6], 50000)
        self.assertEqual(row[7], 1200)
        self.assertEqual(row[8], 80)
        self.assertEqual(row[9], 45)


class TestFormatInsightRowUsesNameWhenNoHandle(unittest.TestCase):
    """ig_handle이 None이면 creator_name으로 폴백"""

    def test_format_insight_row_uses_name_when_no_handle(self):
        entry = {
            "brand_name": "브랜드A",
            "creator_name": "김인플루언서",
            "ig_handle": None,
            "post_url": "https://www.instagram.com/p/XYZ789/",
            "post_type": "피드",
            "views": 10000,
            "likes": 300,
            "shares": 20,
            "comments": 15,
            "collected_at": "2026-03-30T00:00:00Z",
        }

        row = format_insight_row(entry)

        # ig_handle 없으면 creator_name 사용
        self.assertEqual(row[2], "김인플루언서")


class TestWriteToSupabaseUpserts(unittest.TestCase):
    """mocked supabase client로 campaign_posts upsert 호출 검증"""

    def test_write_to_supabase_upserts(self):
        entries = [
            {
                "brand_name": "브랜드X",
                "creator_name": "크리에이터1",
                "ig_handle": "creator1_ig",
                "post_url": "https://www.instagram.com/reel/R001/",
                "post_type": "릴스",
                "views": 20000,
                "likes": 500,
                "shares": 30,
                "comments": 20,
                "collected_at": "2026-03-30T00:00:00Z",
                "source_sheet_id": "sheet_abc",
                "campaign_code": "CAMP001",
            }
        ]

        # Supabase 클라이언트 mock 체인: client.table(...).upsert(...).execute()
        mock_execute = MagicMock()
        mock_execute.count = 1

        mock_upsert = MagicMock()
        mock_upsert.execute.return_value = mock_execute

        mock_table = MagicMock()
        mock_table.upsert.return_value = mock_upsert

        mock_supabase = MagicMock()
        mock_supabase.table.return_value = mock_table

        result = write_to_supabase(mock_supabase, entries)

        # table("campaign_posts") 호출 확인
        mock_supabase.table.assert_called_with("campaign_posts")
        # upsert가 on_conflict="post_url"로 호출됐는지 확인
        call_kwargs = mock_table.upsert.call_args
        self.assertEqual(call_kwargs.kwargs.get("on_conflict"), "post_url")
        # execute 호출 확인
        mock_upsert.execute.assert_called_once()
        # 반환값: 1
        self.assertEqual(result, 1)


if __name__ == "__main__":
    unittest.main()
