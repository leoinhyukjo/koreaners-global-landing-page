# 📅 매일 할 일 체크리스트

SEO 인덱싱 최적화를 위한 일일 루틴입니다. **매일 5-10분** 소요.

## ☀️ 오전 루틴 (9:00 AM)

### 1. SEO 상태 점검 (2분)
```bash
cd ~/Downloads/Claude-Projects/koreaners-global-landing-page
python3 scripts/seo_health_checker.py
```

**확인 사항**:
- [ ] robots.txt 정상 접근
- [ ] sitemap.xml 정상 접근
- [ ] 홈페이지 응답 시간 < 2초
- [ ] HTTPS 정상 작동

**문제 발견 시**: `TROUBLESHOOTING.md` 참고

### 2. 색인 요청 실행 (3분)
```bash
python3 scripts/indexing_automation.py
```

**자동 처리**:
- 우선순위 기반 10개 URL 처리
- 일일 제한 자동 확인
- 로그 자동 저장

**로그 확인**:
```bash
cat indexing_report.txt
```

### 3. 대시보드 확인 (2분)
```bash
open indexing_dashboard.html
```

**주요 메트릭 체크**:
- [ ] 어제 대비 인덱싱 증가 수
- [ ] 오류 발생 URL 확인
- [ ] 우선순위별 진행률

## 📊 오후 루틴 (선택, 3:00 PM)

### Google Search Console 확인 (5분)

1. [Google Search Console](https://search.google.com/search-console) 접속
2. 색인 생성 → 페이지 확인
3. 새로 인덱싱된 페이지 확인
4. 오류 페이지 있는지 확인

**기록할 내용**:
- 오늘 인덱싱된 페이지 수: _____
- 총 인덱싱된 페이지 수: _____
- 발견된 오류: _____

## 🌙 저녁 루틴 (선택, 6:00 PM)

### 성과 기록 (2분)

`daily_log.txt`에 기록:
```
# 2026-02-11

## 인덱싱 현황
- 오늘 제출: 10개
- 오늘 인덱싱 완료: 5개
- 총 인덱싱: 8/50 (16%)

## 발견된 문제
- 없음

## 다음 액션
- Critical 우선순위 URL 계속 처리
```

## 📋 주간 마지막 날 (금요일)

### 추가 작업 (10분)

1. **주간 리포트 생성**
   ```bash
   python3 scripts/generate_weekly_report.py
   ```

2. **URL 목록 업데이트**
   ```bash
   python3 scripts/url_priority_generator.py
   ```

3. **다음 주 계획 수립**
   - 남은 Critical URL: _____
   - 예상 완료 일자: _____

## ⚡ 긴급 상황 대응

### 사이트 다운 감지
```bash
# 즉시 확인
curl -I https://www.koreaners.co
```

**대응**:
1. Vercel 대시보드 확인
2. 배포 상태 확인
3. 롤백 필요 시 실행

### 인덱싱 오류 급증
1. Google Search Console 오류 로그 확인
2. 최근 배포 변경사항 검토
3. robots.txt 및 sitemap.xml 재확인

## 📊 일일 목표 (KPI)

| 메트릭 | 목표 | 실제 |
|--------|------|------|
| 색인 요청 제출 | 10개/일 | ____ |
| 새로 인덱싱된 페이지 | 5개/일 | ____ |
| SEO Health Score | 90+ | ____ |
| 응답 시간 | < 2초 | ____ |

## 🎯 주간 목표 추적

| 주차 | 시작 | 종료 | 목표 | 달성 |
|------|------|------|------|------|
| Week 1 | 3 | ____ | 15 | ____ |
| Week 2 | ____ | ____ | 50 | ____ |
| Week 3 | ____ | ____ | 80 | ____ |
| Week 4 | ____ | ____ | 100 | ____ |

## 💡 팁

### 시간 절약
- 오전 루틴을 **cron job**으로 자동화 가능
  ```bash
  # crontab -e
  0 9 * * * cd ~/path/to/project && python3 scripts/indexing_automation.py
  ```

### 알림 설정
- Google Search Console 이메일 알림 활성화
- Slack/Discord 웹훅 연동 (선택)

### 데이터 백업
- 주간 단위로 `indexing_log.json` 백업
  ```bash
  cp indexing_log.json backups/indexing_log_$(date +%Y%m%d).json
  ```

## ❓ FAQ

**Q: 주말에도 실행해야 하나요?**
A: 아니요. 주중(월-금)만 실행하면 됩니다. 자동화 설정 시 주말 제외 가능.

**Q: 하루 건너뛰면 어떻게 되나요?**
A: 큰 문제 없습니다. 다음 날 정상 진행하면 됩니다. 스크립트가 자동으로 대기 중인 URL부터 처리합니다.

**Q: 색인 요청 후 언제 반영되나요?**
A: 보통 1-3일 소요됩니다. Google의 크롤링 스케줄에 따라 다릅니다.

---

**작성**: 2026-02-11
**다음 리뷰**: 2주 후 (효율성 검토)
