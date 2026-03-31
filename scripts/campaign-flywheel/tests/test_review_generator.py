"""review_generator 테스트"""
from __future__ import annotations

import sys
import os
import unittest

# campaign-flywheel 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from review_generator import calculate_campaign_kpis, build_completion_review_prompt, build_periodic_review_prompt


class TestCalculateCampaignKpis(unittest.TestCase):
    """2개 포스트 + 재무 데이터 → 올바른 집계 및 크리에이터 정렬"""

    def setUp(self):
        self.posts = [
            {
                "ig_handle": "creator_a",
                "creator_name": "크리에이터A",
                "views": 100000,
                "likes": 3000,
                "shares": 500,
                "comments": 200,
            },
            {
                "ig_handle": "creator_b",
                "creator_name": "크리에이터B",
                "views": 50000,
                "likes": 1000,
                "shares": 200,
                "comments": 100,
            },
        ]
        self.financials = {
            "contract_amount_krw": 2000000,
            "margin_krw": 600000,
        }

    def test_total_aggregations(self):
        kpis = calculate_campaign_kpis(self.posts, self.financials)

        self.assertEqual(kpis["total_views"], 150000)
        self.assertEqual(kpis["total_likes"], 4000)
        self.assertEqual(kpis["total_shares"], 700)
        self.assertEqual(kpis["total_comments"], 300)
        self.assertEqual(kpis["total_engagement"], 5000)  # likes+shares+comments

    def test_rates_and_costs(self):
        kpis = calculate_campaign_kpis(self.posts, self.financials)

        # avg_engagement_rate = 5000/150000*100 ≈ 3.333...
        self.assertAlmostEqual(kpis["avg_engagement_rate"], 5000 / 150000 * 100, places=4)
        # cpv = 2000000 / 150000 ≈ 13.333...
        self.assertAlmostEqual(kpis["cpv"], 2000000 / 150000, places=4)
        # cpe = 2000000 / 5000 = 400
        self.assertAlmostEqual(kpis["cpe"], 2000000 / 5000, places=4)
        # margin_rate = 600000 / 2000000 * 100 = 30
        self.assertAlmostEqual(kpis["margin_rate"], 30.0, places=4)

    def test_creator_sorting_by_views_desc(self):
        kpis = calculate_campaign_kpis(self.posts, self.financials)

        # creator_a(100000뷰)가 creator_b(50000뷰)보다 앞에
        top = kpis["top_creators"]
        self.assertEqual(len(top), 2)
        self.assertEqual(top[0]["ig_handle"], "creator_a")
        self.assertEqual(top[1]["ig_handle"], "creator_b")

    def test_bottom_creators_only_when_more_than_3(self):
        """2명이면 bottom_creators 없음"""
        kpis = calculate_campaign_kpis(self.posts, self.financials)
        self.assertEqual(kpis["bottom_creators"], [])

    def test_bottom_creators_when_more_than_3(self):
        """4명이면 bottom_creators = 하위 3명"""
        posts = self.posts + [
            {"ig_handle": "creator_c", "creator_name": "크리에이터C",
             "views": 30000, "likes": 500, "shares": 100, "comments": 50},
            {"ig_handle": "creator_d", "creator_name": "크리에이터D",
             "views": 10000, "likes": 100, "shares": 20, "comments": 10},
        ]
        kpis = calculate_campaign_kpis(posts, self.financials)

        self.assertEqual(len(kpis["top_creators"]), 3)
        self.assertEqual(len(kpis["bottom_creators"]), 3)
        # bottom 첫번째는 가장 뷰 적은 크리에이터
        self.assertEqual(kpis["bottom_creators"][0]["ig_handle"], "creator_d")

    def test_creator_count(self):
        kpis = calculate_campaign_kpis(self.posts, self.financials)
        self.assertEqual(kpis["creator_count"], 2)


class TestCalculateCampaignKpisZeroViews(unittest.TestCase):
    """0 뷰 → cpv=0, avg_engagement_rate=0 (ZeroDivisionError 없음)"""

    def test_zero_views(self):
        posts = [
            {
                "ig_handle": "creator_z",
                "creator_name": "제로뷰",
                "views": 0,
                "likes": 0,
                "shares": 0,
                "comments": 0,
            }
        ]
        financials = {"contract_amount_krw": 500000, "margin_krw": 100000}

        kpis = calculate_campaign_kpis(posts, financials)

        self.assertEqual(kpis["total_views"], 0)
        self.assertEqual(kpis["cpv"], 0)
        self.assertEqual(kpis["avg_engagement_rate"], 0)
        self.assertEqual(kpis["cpe"], 0)

    def test_zero_contract_amount(self):
        posts = [
            {
                "ig_handle": "creator_x",
                "creator_name": "크리에이터X",
                "views": 10000,
                "likes": 300,
                "shares": 50,
                "comments": 20,
            }
        ]
        financials = {"contract_amount_krw": 0, "margin_krw": 0}

        kpis = calculate_campaign_kpis(posts, financials)

        self.assertEqual(kpis["cpv"], 0)
        self.assertEqual(kpis["cpe"], 0)
        self.assertEqual(kpis["margin_rate"], 0)


class TestBuildCompletionReviewPrompt(unittest.TestCase):
    """완료 리뷰 프롬프트 — 브랜드명, 주요 수치, CPV 포함 검증"""

    def setUp(self):
        self.kpis = {
            "total_views": 150000,
            "total_likes": 4000,
            "total_shares": 700,
            "total_comments": 300,
            "total_engagement": 5000,
            "avg_engagement_rate": 3.33,
            "cpv": 13.33,
            "cpe": 400.0,
            "margin_rate": 30.0,
            "top_creators": [
                {"ig_handle": "creator_a", "views": 100000, "total_engagement": 3700},
            ],
            "bottom_creators": [],
            "creator_count": 2,
        }
        self.campaign = {
            "brand_name": "테스트브랜드",
            "campaign_code": "CAMP001",
            "contract_amount_krw": 2000000,
            "margin_krw": 600000,
        }

    def test_contains_brand_name(self):
        prompt = build_completion_review_prompt(self.kpis, self.campaign)
        self.assertIn("테스트브랜드", prompt)

    def test_contains_cpv(self):
        prompt = build_completion_review_prompt(self.kpis, self.campaign)
        self.assertIn("CPV", prompt)

    def test_contains_total_views(self):
        prompt = build_completion_review_prompt(self.kpis, self.campaign)
        # 150,000 (천단위 콤마 포함)
        self.assertIn("150,000", prompt)

    def test_contains_no_markdown_instruction(self):
        prompt = build_completion_review_prompt(self.kpis, self.campaign)
        self.assertIn("마크다운 금지", prompt)

    def test_contains_action_items_request(self):
        prompt = build_completion_review_prompt(self.kpis, self.campaign)
        self.assertIn("액션아이템", prompt)

    def test_contains_top_creators(self):
        prompt = build_completion_review_prompt(self.kpis, self.campaign)
        self.assertIn("creator_a", prompt)


class TestBuildPeriodicReviewPrompt(unittest.TestCase):
    """정기 리뷰 프롬프트 — 기간 날짜 및 총액 포함 검증"""

    def setUp(self):
        self.summary = {
            "period_start": "2026-03-01",
            "period_end": "2026-03-14",
            "total_campaigns": 8,
            "active_campaigns": 3,
            "total_contract_krw": 15000000,
            "total_margin_krw": 4500000,
            "prev_period": {
                "total_campaigns": 6,
                "total_contract_krw": 12000000,
                "total_margin_krw": 3600000,
            },
            "creator_pool_stats": {
                "total": 120,
                "new": 5,
            },
            "brand_stats": {
                "total": 15,
                "returning": 8,
            },
        }

    def test_contains_period_dates(self):
        prompt = build_periodic_review_prompt(self.summary)
        self.assertIn("2026-03-01", prompt)
        self.assertIn("2026-03-14", prompt)

    def test_contains_total_contract(self):
        prompt = build_periodic_review_prompt(self.summary)
        # 15,000,000 (천단위 콤마)
        self.assertIn("15,000,000", prompt)

    def test_contains_total_campaigns(self):
        prompt = build_periodic_review_prompt(self.summary)
        self.assertIn("8", prompt)

    def test_contains_korean_sections(self):
        prompt = build_periodic_review_prompt(self.summary)
        self.assertIn("핵심 요약", prompt)
        self.assertIn("액션아이템", prompt)


if __name__ == "__main__":
    unittest.main()
