# 🚀 빠른 시작 가이드

koreaners.co SEO 인덱싱 최적화를 위한 빠른 시작 가이드입니다.

## 📋 사전 준비사항

### 1. Python 환경
```bash
python3 --version  # Python 3.8+ 필요
```

### 2. 필요한 패키지 설치
```bash
cd scripts
pip3 install -r requirements.txt
```

### 3. 환경 변수 설정
`.env.local` 파일에 다음 내용 추가:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🎯 Step 1: SEO 상태 점검 (5분)

```bash
python3 scripts/seo_health_checker.py
```

**결과 확인**:
- `seo_health_report.json` - JSON 형식 리포트
- `seo_health_report.txt` - 텍스트 형식 리포트

## 🗺️ Step 2: 사이트맵 배포 (즉시)

### Next.js 프로젝트에 이미 추가됨
- `public/robots.txt` ✅
- `app/sitemap.ts` ✅

### 로컬 테스트
```bash
npm run dev
```

브라우저에서 확인:
- http://localhost:3000/robots.txt
- http://localhost:3000/sitemap.xml

### 프로덕션 배포
```bash
git add public/robots.txt app/sitemap.ts
git commit -m "Add SEO: robots.txt and dynamic sitemap"
git push
```

Vercel이 자동으로 배포합니다. 배포 후 확인:
- https://www.koreaners.co/robots.txt
- https://www.koreaners.co/sitemap.xml

## 📊 Step 3: URL 우선순위 목록 생성 (2분)

```bash
python3 scripts/url_priority_generator.py
```

**생성되는 파일**:
- `url_priority_list.csv` - CSV 형식
- `indexing_schedule.xlsx` - Excel 형식 (openpyxl 설치 시)

## 🔧 Step 4: Google Search Console 설정 (15분)

### 4-1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성: "koreaners-seo"
3. API 및 서비스 → 라이브러리
4. "Google Indexing API" 검색 및 활성화
5. 사용자 인증 정보 → 서비스 계정 만들기
   - 이름: "koreaners-indexing-bot"
   - 역할: "소유자"
6. 키 만들기 → JSON
7. 다운로드한 JSON 파일을 `scripts/credentials.json`으로 저장

### 4-2. Search Console에 서비스 계정 추가

1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 선택: "https://www.koreaners.co"
3. 설정 → 사용자 및 권한
4. 사용자 추가
   - 이메일: `[서비스 계정 이메일]@[프로젝트ID].iam.gserviceaccount.com`
   - 권한: "소유자"

### 4-3. 사이트맵 제출

1. Google Search Console → 색인 → 사이트맵
2. 새 사이트맵 추가: `https://www.koreaners.co/sitemap.xml`
3. 제출

## 🤖 Step 5: 자동 색인 요청 시작 (매일 5분)

```bash
python3 scripts/indexing_automation.py
```

**일일 10개 URL씩 자동 처리**
- Critical 우선순위부터 처리
- 로그 파일: `indexing_log.json`
- 리포트: `indexing_report.txt`

## 📈 Step 6: 대시보드 확인

브라우저에서 `indexing_dashboard.html` 열기:
```bash
open indexing_dashboard.html
```

**주요 메트릭**:
- 총 페이지 수
- 인덱싱 완료 수
- 진행률
- 우선순위별 현황

## ✅ 완료 체크리스트

- [ ] Python 패키지 설치
- [ ] robots.txt 및 sitemap.xml 배포
- [ ] URL 우선순위 목록 생성
- [ ] Google Cloud Console 설정
- [ ] Search Console 서비스 계정 추가
- [ ] 사이트맵 제출
- [ ] 첫 번째 자동 색인 요청 실행
- [ ] 대시보드 확인

## 🎯 예상 타임라인

| 기간 | 목표 | 현재 상태 |
|------|------|----------|
| **Day 1** | 설정 완료, 사이트맵 제출 | ⏳ 진행 중 |
| **Week 1** | 주요 페이지 10개 인덱싱 | 🔜 대기 |
| **Week 2** | 50개 이상 페이지 인덱싱 | 🔜 대기 |
| **Week 4** | 전체 페이지 100% 인덱싱 | 🔜 대기 |

## 📞 문제 발생 시

`TROUBLESHOOTING.md` 참고

## 📚 다음 단계

- `DAILY_TASKS.md` - 매일 할 일
- `WEEKLY_CHECKLIST.md` - 주간 체크리스트
- `SETUP.md` - 상세 설정 가이드

---

**작성**: 2026-02-11
**업데이트**: 자동 색인 시스템 구축 완료
