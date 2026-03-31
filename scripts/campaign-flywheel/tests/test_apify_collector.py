"""apify_collector 테스트"""
from __future__ import annotations

import sys
import os
import unittest
from unittest.mock import MagicMock, patch, call
from datetime import datetime, timezone

# campaign-flywheel 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from apify_collector import parse_apify_result, collect_ig_metrics


class TestParseApifyResultExtractsMetrics(unittest.TestCase):
    """모든 필드가 존재할 때 정상 추출하는지 확인"""

    def test_parse_apify_result_extracts_metrics(self):
        raw = {
            "url": "https://www.instagram.com/reel/ABC123/",
            "videoPlayCount": 15000,
            "videoViewCount": 12000,
            "likesCount": 500,
            "sharesCount": 80,
            "commentsCount": 30,
        }
        result = parse_apify_result(raw)
        self.assertEqual(result["views"], 15000)
        self.assertEqual(result["likes"], 500)
        self.assertEqual(result["shares"], 80)
        self.assertEqual(result["comments"], 30)


class TestParseApifyResultHandlesMissingFields(unittest.TestCase):
    """일부 필드 누락 시 나머지는 0으로 기본값 처리"""

    def test_parse_apify_result_handles_missing_fields(self):
        raw = {
            "url": "https://www.instagram.com/p/XYZ789/",
            "likesCount": 200,
        }
        result = parse_apify_result(raw)
        self.assertEqual(result["views"], 0)
        self.assertEqual(result["likes"], 200)
        self.assertEqual(result["shares"], 0)
        self.assertEqual(result["comments"], 0)


class TestParseApifyResultPrefersPlayCountForReels(unittest.TestCase):
    """videoPlayCount와 videoViewCount 둘 다 있을 때 videoPlayCount 우선"""

    def test_parse_apify_result_prefers_play_count_for_reels(self):
        raw = {
            "url": "https://www.instagram.com/reel/REEL001/",
            "videoPlayCount": 20000,
            "videoViewCount": 18000,
            "likesCount": 400,
            "sharesCount": 50,
            "commentsCount": 10,
        }
        result = parse_apify_result(raw)
        self.assertEqual(result["views"], 20000)


class TestCollectIgMetricsBatchesUrls(unittest.TestCase):
    """5개 URL을 mocked ApifyClient로 처리해 5개 결과 반환"""

    def test_collect_ig_metrics_batches_urls(self):
        entries = [
            {"post_url": "https://www.instagram.com/reel/A1/"},
            {"post_url": "https://www.instagram.com/reel/A2/"},
            {"post_url": "https://www.instagram.com/reel/A3/"},
            {"post_url": "https://www.instagram.com/p/A4/"},
            {"post_url": "https://www.instagram.com/p/A5/"},
        ]

        # Apify 응답 데이터 mock
        mock_items = [
            {"url": "https://www.instagram.com/reel/A1/", "videoPlayCount": 1000, "likesCount": 10, "sharesCount": 2, "commentsCount": 3},
            {"url": "https://www.instagram.com/reel/A2/", "videoPlayCount": 2000, "likesCount": 20, "sharesCount": 4, "commentsCount": 6},
            {"url": "https://www.instagram.com/reel/A3/", "videoViewCount": 3000, "likesCount": 30, "sharesCount": 6, "commentsCount": 9},
            {"url": "https://www.instagram.com/p/A4/", "likesCount": 40, "sharesCount": 8, "commentsCount": 12},
            {"url": "https://www.instagram.com/p/A5/", "likesCount": 50, "sharesCount": 10, "commentsCount": 15},
        ]

        mock_run = {"defaultDatasetId": "dataset-123"}
        mock_list_items_result = MagicMock()
        mock_list_items_result.items = mock_items

        mock_dataset = MagicMock()
        mock_dataset.list_items.return_value = mock_list_items_result

        mock_actor = MagicMock()
        mock_actor.call.return_value = mock_run

        mock_client_instance = MagicMock()
        mock_client_instance.actor.return_value = mock_actor
        mock_client_instance.dataset.return_value = mock_dataset

        with patch("apify_collector.ApifyClient", return_value=mock_client_instance):
            result = collect_ig_metrics(entries, batch_size=25)

        self.assertEqual(len(result), 5)

        # A1 — videoPlayCount 우선
        self.assertEqual(result[0]["views"], 1000)
        self.assertEqual(result[0]["likes"], 10)
        self.assertEqual(result[0]["shares"], 2)
        self.assertEqual(result[0]["comments"], 3)
        self.assertIn("collected_at", result[0])

        # A3 — videoViewCount fallback
        self.assertEqual(result[2]["views"], 3000)

        # A4, A5 — views 없으므로 0
        self.assertEqual(result[3]["views"], 0)
        self.assertEqual(result[4]["views"], 0)
        self.assertEqual(result[4]["likes"], 50)


if __name__ == "__main__":
    unittest.main()
