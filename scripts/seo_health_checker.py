#!/usr/bin/env python3
"""
SEO Health Checker

웹사이트의 SEO 상태를 정기적으로 점검하고 문제를 보고합니다.

점검 항목:
- robots.txt 접근성
- sitemap.xml 유효성
- 페이지 응답 시간
- 메타 태그 존재 여부
- 모바일 친화성
- HTTPS 설정

사용법:
    python seo_health_checker.py

"""

import requests
import xml.etree.ElementTree as ET
from typing import Dict, List, Tuple
from datetime import datetime
import json
import time

BASE_URL = 'https://www.koreaners.co'
TIMEOUT = 10


class SEOHealthChecker:
    """SEO 상태 점검 클래스"""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url.rstrip('/')
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': self.base_url,
            'checks': {},
            'score': 0,
            'issues': [],
            'warnings': [],
            'success': []
        }

    def check_robots_txt(self) -> Tuple[bool, str]:
        """robots.txt 점검"""
        try:
            url = f'{self.base_url}/robots.txt'
            response = requests.get(url, timeout=TIMEOUT)

            if response.status_code == 200:
                content = response.text

                # 기본 검증
                has_user_agent = 'User-agent:' in content
                has_sitemap = 'Sitemap:' in content

                if has_user_agent and has_sitemap:
                    return True, "✅ robots.txt 정상 (User-agent, Sitemap 포함)"
                elif has_user_agent:
                    return True, "⚠️  robots.txt 존재하지만 Sitemap 선언 누락"
                else:
                    return False, "❌ robots.txt 형식 오류"
            else:
                return False, f"❌ robots.txt 접근 실패 (HTTP {response.status_code})"

        except requests.RequestException as e:
            return False, f"❌ robots.txt 접근 오류: {e}"

    def check_sitemap_xml(self) -> Tuple[bool, str]:
        """sitemap.xml 점검"""
        try:
            url = f'{self.base_url}/sitemap.xml'
            response = requests.get(url, timeout=TIMEOUT)

            if response.status_code == 200:
                try:
                    # XML 파싱
                    root = ET.fromstring(response.content)

                    # 네임스페이스 처리
                    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
                    urls = root.findall('.//sm:url', ns)

                    if urls:
                        return True, f"✅ sitemap.xml 정상 ({len(urls)}개 URL)"
                    else:
                        return False, "⚠️  sitemap.xml에 URL 없음"

                except ET.ParseError:
                    return False, "❌ sitemap.xml XML 파싱 오류"
            else:
                return False, f"❌ sitemap.xml 접근 실패 (HTTP {response.status_code})"

        except requests.RequestException as e:
            return False, f"❌ sitemap.xml 접근 오류: {e}"

    def check_page_response(self, path: str = '') -> Tuple[bool, str]:
        """페이지 응답 시간 점검"""
        try:
            url = f'{self.base_url}{path}'
            start_time = time.time()
            response = requests.get(url, timeout=TIMEOUT)
            response_time = time.time() - start_time

            if response.status_code == 200:
                if response_time < 2.0:
                    return True, f"✅ 빠른 응답 ({response_time:.2f}초)"
                elif response_time < 5.0:
                    return True, f"⚠️  응답 느림 ({response_time:.2f}초)"
                else:
                    return False, f"❌ 응답 매우 느림 ({response_time:.2f}초)"
            else:
                return False, f"❌ HTTP {response.status_code}"

        except requests.RequestException as e:
            return False, f"❌ 접근 오류: {e}"

    def check_https(self) -> Tuple[bool, str]:
        """HTTPS 설정 점검"""
        if self.base_url.startswith('https://'):
            try:
                response = requests.get(self.base_url, timeout=TIMEOUT)
                if response.url.startswith('https://'):
                    return True, "✅ HTTPS 정상 (리다이렉트 없음)"
                else:
                    return False, "⚠️  HTTP로 리다이렉트됨"
            except requests.RequestException as e:
                return False, f"❌ HTTPS 접근 오류: {e}"
        else:
            return False, "❌ HTTPS 미사용"

    def check_meta_tags(self, path: str = '') -> Tuple[bool, str]:
        """메타 태그 점검"""
        try:
            url = f'{self.base_url}{path}'
            response = requests.get(url, timeout=TIMEOUT)

            if response.status_code == 200:
                html = response.text.lower()

                has_title = '<title>' in html
                has_description = 'name="description"' in html or 'property="og:description"' in html
                has_og_tags = 'property="og:' in html
                has_canonical = 'rel="canonical"' in html

                issues = []
                if not has_title:
                    issues.append("title 태그 없음")
                if not has_description:
                    issues.append("description 없음")
                if not has_og_tags:
                    issues.append("OG 태그 없음")
                if not has_canonical:
                    issues.append("canonical 태그 없음")

                if not issues:
                    return True, "✅ 모든 메타 태그 존재"
                elif len(issues) <= 2:
                    return True, f"⚠️  일부 태그 누락: {', '.join(issues)}"
                else:
                    return False, f"❌ 중요 태그 누락: {', '.join(issues)}"
            else:
                return False, f"❌ 페이지 접근 실패 (HTTP {response.status_code})"

        except requests.RequestException as e:
            return False, f"❌ 접근 오류: {e}"

    def run_all_checks(self):
        """모든 점검 실행"""
        print("🔍 SEO Health Check 시작\n")

        checks = [
            ("robots.txt", self.check_robots_txt()),
            ("sitemap.xml", self.check_sitemap_xml()),
            ("HTTPS", self.check_https()),
            ("홈페이지 응답", self.check_page_response('/')),
            ("홈페이지 메타 태그", self.check_meta_tags('/')),
        ]

        total_score = 0
        max_score = len(checks)

        for name, (success, message) in checks:
            self.results['checks'][name] = {
                'success': success,
                'message': message
            }

            if success:
                total_score += 1
                if "✅" in message:
                    self.results['success'].append(f"{name}: {message}")
                else:
                    self.results['warnings'].append(f"{name}: {message}")
            else:
                self.results['issues'].append(f"{name}: {message}")

            print(f"{'✅' if success else '❌'} {name}: {message}")

        self.results['score'] = int((total_score / max_score) * 100)

        print(f"\n📊 종합 점수: {self.results['score']}/100")
        print(f"   - 성공: {len(self.results['success'])}")
        print(f"   - 경고: {len(self.results['warnings'])}")
        print(f"   - 문제: {len(self.results['issues'])}")

        # 결과 저장
        with open('seo_health_report.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 리포트 저장: seo_health_report.json")

        return self.results

    def generate_text_report(self) -> str:
        """텍스트 리포트 생성"""
        lines = []
        lines.append("=" * 60)
        lines.append("SEO Health Check 리포트")
        lines.append("=" * 60)
        lines.append(f"점검 일시: {self.results['timestamp']}")
        lines.append(f"대상 사이트: {self.results['base_url']}")
        lines.append(f"종합 점수: {self.results['score']}/100")
        lines.append("")

        if self.results['success']:
            lines.append("✅ 정상 항목:")
            for item in self.results['success']:
                lines.append(f"  • {item}")
            lines.append("")

        if self.results['warnings']:
            lines.append("⚠️  경고 항목:")
            for item in self.results['warnings']:
                lines.append(f"  • {item}")
            lines.append("")

        if self.results['issues']:
            lines.append("❌ 문제 항목:")
            for item in self.results['issues']:
                lines.append(f"  • {item}")
            lines.append("")

        lines.append("=" * 60)

        report = "\n".join(lines)

        with open('seo_health_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)

        return report


def main():
    """메인 실행 함수"""
    checker = SEOHealthChecker()
    checker.run_all_checks()
    report = checker.generate_text_report()

    print(f"\n{report}")


if __name__ == '__main__':
    main()
