#!/usr/bin/env python3
"""
Google Search Console 색인 자동화 스크립트

Google Indexing API를 사용하여 URL 색인을 자동으로 요청합니다.
일일 200개 제한을 고려하여 우선순위 기반으로 처리합니다.

사용법:
    python indexing_automation.py

요구사항:
    - Google Cloud Console에서 Indexing API 활성화
    - 서비스 계정 JSON 키 파일 (credentials.json)
    - pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

"""

import os
import json
import csv
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

# Google API 클라이언트
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    print("❌ Google API 클라이언트 미설치")
    print("   pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    exit(1)


# 설정
CREDENTIALS_FILE = 'credentials.json'  # Google 서비스 계정 JSON 키
SCOPES = ['https://www.googleapis.com/auth/indexing']
URL_LIST_FILE = 'url_priority_list.csv'
LOG_FILE = 'indexing_log.json'
DAILY_LIMIT = 200  # Google Indexing API 일일 제한
BATCH_SIZE = 10    # 한 번에 처리할 URL 수

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('indexing.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class IndexingAutomation:
    """Google Indexing API 자동화 클래스"""

    def __init__(self, credentials_file: str = CREDENTIALS_FILE):
        self.credentials_file = credentials_file
        self.service = None
        self.log_data = self.load_log()

        if not os.path.exists(self.credentials_file):
            logger.error(f"❌ 인증 파일을 찾을 수 없습니다: {self.credentials_file}")
            logger.error("   Google Cloud Console에서 서비스 계정 JSON 키를 다운로드하세요")
            raise FileNotFoundError(self.credentials_file)

        self.authenticate()

    def authenticate(self):
        """Google API 인증"""
        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=SCOPES
            )
            self.service = build('indexing', 'v3', credentials=credentials)
            logger.info("✅ Google Indexing API 인증 성공")
        except Exception as e:
            logger.error(f"❌ 인증 실패: {e}")
            raise

    def load_log(self) -> Dict:
        """로그 파일 로드"""
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            'last_run': None,
            'total_submitted': 0,
            'success_count': 0,
            'error_count': 0,
            'urls': {}
        }

    def save_log(self):
        """로그 파일 저장"""
        with open(LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.log_data, f, ensure_ascii=False, indent=2)

    def load_urls(self) -> List[Dict]:
        """URL 목록 로드"""
        if not os.path.exists(URL_LIST_FILE):
            logger.error(f"❌ URL 목록 파일을 찾을 수 없습니다: {URL_LIST_FILE}")
            logger.error("   먼저 url_priority_generator.py를 실행하세요")
            return []

        urls = []
        with open(URL_LIST_FILE, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                urls.append(row)

        logger.info(f"📋 URL 목록 로드: {len(urls)}개")
        return urls

    def check_daily_limit(self) -> bool:
        """일일 제한 확인"""
        today = datetime.now().strftime('%Y-%m-%d')
        last_run = self.log_data.get('last_run')

        if last_run and last_run.startswith(today):
            submitted_today = self.log_data.get('submitted_today', 0)
            if submitted_today >= DAILY_LIMIT:
                logger.warning(f"⚠️  일일 제한 도달: {submitted_today}/{DAILY_LIMIT}")
                return False
        else:
            # 새로운 날짜, 카운터 리셋
            self.log_data['submitted_today'] = 0

        return True

    def request_indexing(self, url: str) -> bool:
        """단일 URL 색인 요청"""
        if not self.service:
            logger.error("❌ API 서비스가 초기화되지 않았습니다")
            return False

        try:
            body = {
                'url': url,
                'type': 'URL_UPDATED'  # URL_UPDATED 또는 URL_DELETED
            }

            response = self.service.urlNotifications().publish(body=body).execute()
            logger.info(f"✅ 색인 요청 성공: {url}")

            # 로그 업데이트
            self.log_data['urls'][url] = {
                'status': 'submitted',
                'timestamp': datetime.now().isoformat(),
                'response': response
            }
            self.log_data['success_count'] += 1
            self.log_data['submitted_today'] = self.log_data.get('submitted_today', 0) + 1

            return True

        except HttpError as e:
            error_msg = str(e)
            logger.error(f"❌ 색인 요청 실패: {url} - {error_msg}")

            # 로그 업데이트
            self.log_data['urls'][url] = {
                'status': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': error_msg
            }
            self.log_data['error_count'] += 1

            return False

        except Exception as e:
            logger.error(f"❌ 예외 발생: {url} - {e}")
            return False

    def process_batch(self, urls: List[Dict], batch_size: int = BATCH_SIZE):
        """배치로 URL 처리"""
        if not self.check_daily_limit():
            logger.info("일일 제한에 도달했습니다. 내일 다시 실행하세요.")
            return

        # 아직 제출하지 않은 URL 필터링
        pending_urls = [
            url_info for url_info in urls
            if url_info['url'] not in self.log_data['urls']
            or self.log_data['urls'][url_info['url']]['status'] == 'error'
        ]

        # 우선순위 순으로 정렬
        pending_urls.sort(key=lambda x: float(x.get('priority_score', 0)), reverse=True)

        logger.info(f"📊 처리 대기 URL: {len(pending_urls)}개")

        # 배치 처리
        processed = 0
        for url_info in pending_urls[:batch_size]:
            url = url_info['url']

            if not self.check_daily_limit():
                logger.info("⚠️  일일 제한 도달. 배치 처리 중단")
                break

            logger.info(f"🔄 처리 중 ({processed + 1}/{min(batch_size, len(pending_urls))}): {url}")
            success = self.request_indexing(url)

            if success:
                processed += 1
                self.log_data['total_submitted'] += 1

            # API 제한 방지를 위한 딜레이
            time.sleep(1)

        # 로그 저장
        self.log_data['last_run'] = datetime.now().isoformat()
        self.save_log()

        logger.info(f"\n✅ 배치 처리 완료: {processed}개 URL 제출")
        logger.info(f"📊 총 통계:")
        logger.info(f"   - 총 제출: {self.log_data['total_submitted']}")
        logger.info(f"   - 성공: {self.log_data['success_count']}")
        logger.info(f"   - 실패: {self.log_data['error_count']}")

    def generate_report(self) -> str:
        """리포트 생성"""
        report = []
        report.append("=" * 60)
        report.append("Google Search Console 색인 요청 리포트")
        report.append("=" * 60)
        report.append(f"생성 일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")

        report.append("📊 전체 통계")
        report.append(f"  • 총 제출 URL: {self.log_data['total_submitted']}")
        report.append(f"  • 성공: {self.log_data['success_count']}")
        report.append(f"  • 실패: {self.log_data['error_count']}")
        report.append(f"  • 오늘 제출: {self.log_data.get('submitted_today', 0)}/{DAILY_LIMIT}")
        report.append("")

        # 최근 제출 URL
        report.append("📋 최근 제출 URL (최대 10개)")
        urls_by_time = sorted(
            self.log_data['urls'].items(),
            key=lambda x: x[1]['timestamp'],
            reverse=True
        )

        for url, info in urls_by_time[:10]:
            status_icon = "✅" if info['status'] == 'submitted' else "❌"
            report.append(f"  {status_icon} {url}")
            report.append(f"     시각: {info['timestamp']}")
            if info['status'] == 'error':
                report.append(f"     오류: {info.get('error', '알 수 없음')}")
            report.append("")

        report.append("=" * 60)

        report_text = "\n".join(report)
        logger.info(f"\n{report_text}")

        # 파일로 저장
        with open('indexing_report.txt', 'w', encoding='utf-8') as f:
            f.write(report_text)

        return report_text


def main():
    """메인 실행 함수"""
    logger.info("🚀 Google Search Console 색인 자동화 시작\n")

    try:
        automation = IndexingAutomation()
        urls = automation.load_urls()

        if not urls:
            logger.error("처리할 URL이 없습니다")
            return

        automation.process_batch(urls, BATCH_SIZE)
        automation.generate_report()

        logger.info("\n✅ 모든 작업 완료!")

    except Exception as e:
        logger.error(f"❌ 오류 발생: {e}", exc_info=True)
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
