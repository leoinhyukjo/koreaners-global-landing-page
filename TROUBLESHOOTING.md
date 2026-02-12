# 🔧 문제 해결 가이드

SEO 인덱싱 최적화 중 발생할 수 있는 문제와 해결 방법입니다.

---

## 📑 목차
1. [robots.txt 문제](#robotstxt-문제)
2. [sitemap.xml 문제](#sitemapxml-문제)
3. [Google Indexing API 문제](#google-indexing-api-문제)
4. [인덱싱 속도 문제](#인덱싱-속도-문제)
5. [Python 스크립트 오류](#python-스크립트-오류)
6. [대시보드 문제](#대시보드-문제)
7. [Vercel 배포 문제](#vercel-배포-문제)

---

## robots.txt 문제

### ❌ 문제: robots.txt 404 오류

**증상**:
```bash
curl https://www.koreaners.co/robots.txt
# 404 Not Found
```

**원인**:
- `public/robots.txt` 파일이 배포되지 않음
- Vercel 빌드 중 제외됨
- 캐시 문제

**해결 방법**:

1. **파일 존재 확인**
   ```bash
   ls -la public/robots.txt
   ```

2. **Git에 추가되었는지 확인**
   ```bash
   git status
   git add public/robots.txt
   git commit -m "Add robots.txt"
   git push
   ```

3. **Vercel 재배포**
   - Vercel 대시보드 → Deployments → Redeploy

4. **캐시 클리어**
   ```bash
   # 브라우저 시크릿 모드로 확인
   # 또는 curl로 헤더 포함 확인
   curl -I https://www.koreaners.co/robots.txt
   ```

### ❌ 문제: robots.txt 내용이 비어있음

**원인**:
- 파일이 잘못 생성됨
- UTF-8 인코딩 문제

**해결 방법**:
```bash
# 내용 확인
cat public/robots.txt

# 다시 생성
cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://www.koreaners.co/sitemap.xml
EOF

# Git에 커밋
git add public/robots.txt
git commit -m "Fix robots.txt content"
git push
```

---

## sitemap.xml 문제

### ❌ 문제: sitemap.xml 404 오류

**증상**:
```bash
curl https://www.koreaners.co/sitemap.xml
# 404 Not Found
```

**원인**:
- `app/sitemap.ts` 파일 오류
- Next.js 빌드 실패
- 라우팅 문제

**해결 방법**:

1. **로컬에서 테스트**
   ```bash
   npm run dev
   # http://localhost:3000/sitemap.xml 접속
   ```

2. **빌드 오류 확인**
   ```bash
   npm run build
   # 오류 메시지 확인
   ```

3. **sitemap.ts 문법 확인**
   ```bash
   # TypeScript 타입 체크
   npx tsc --noEmit
   ```

4. **Supabase 연결 확인**
   ```bash
   # .env.local 파일 확인
   cat .env.local | grep SUPABASE
   ```

### ❌ 문제: sitemap.xml이 비어있음

**증상**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
```

**원인**:
- Supabase 연결 실패
- 데이터베이스에 데이터 없음

**해결 방법**:

1. **Supabase 연결 테스트**
   ```typescript
   // app/sitemap.ts에 로그 추가
   console.log('Fetching portfolios...')
   const { data, error } = await supabase.from('portfolios').select('*')
   console.log('Portfolios:', data, 'Error:', error)
   ```

2. **환경 변수 확인**
   - Vercel 대시보드 → Settings → Environment Variables
   - `NEXT_PUBLIC_SUPABASE_URL` 확인
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인

3. **재배포**
   ```bash
   git push
   # Vercel 자동 재배포
   ```

---

## Google Indexing API 문제

### ❌ 문제: 인증 실패

**오류 메시지**:
```
Error: Could not load credentials from file
```

**원인**:
- `credentials.json` 파일 없음
- 파일 경로 오류
- 권한 문제

**해결 방법**:

1. **파일 존재 확인**
   ```bash
   ls -la scripts/credentials.json
   ```

2. **권한 확인**
   ```bash
   chmod 600 scripts/credentials.json
   ```

3. **JSON 형식 확인**
   ```bash
   python3 -m json.tool scripts/credentials.json
   ```

4. **재다운로드**
   - Google Cloud Console → 서비스 계정
   - 키 관리 → 새 키 만들기 → JSON

### ❌ 문제: API 할당량 초과

**오류 메시지**:
```
Error: Quota exceeded for quota metric 'Queries' and limit 'Queries per day'
```

**원인**:
- 일일 200개 제한 초과

**해결 방법**:

1. **로그 확인**
   ```bash
   cat indexing_log.json | grep submitted_today
   ```

2. **다음 날까지 대기**
   - 자동으로 리셋됨 (UTC 기준 자정)

3. **할당량 증가 요청**
   - Google Cloud Console → IAM 및 관리자 → 할당량
   - Indexing API 할당량 증가 신청

### ❌ 문제: 403 Forbidden

**오류 메시지**:
```
Error: The caller does not have permission
```

**원인**:
- Search Console에 서비스 계정 미추가
- 권한 부족

**해결 방법**:

1. **Search Console 확인**
   - Google Search Console → 설정 → 사용자 및 권한
   - 서비스 계정 이메일 확인

2. **서비스 계정 추가**
   - 사용자 추가 → 서비스 계정 이메일 입력
   - 권한: "소유자" 선택

3. **24시간 대기**
   - 권한 변경 후 최대 24시간 소요

---

## 인덱싱 속도 문제

### ❌ 문제: 인덱싱이 너무 느림

**증상**:
- 1주일 경과 후에도 10개 미만 인덱싱
- Search Console에 "발견됨 - 현재 색인이 생성되지 않음"

**원인**:
- 사이트 권위도 낮음
- 콘텐츠 품질 문제
- 크롤링 예산 부족

**해결 방법**:

1. **URL 수동 검사**
   - Search Console → URL 검사
   - Critical URL 수동 제출

2. **콘텐츠 개선**
   - 각 페이지에 고유한 가치 있는 콘텐츠 추가
   - 최소 300단어 이상

3. **내부 링크 강화**
   - 홈페이지에서 주요 페이지로 링크
   - 사이트맵 외에도 HTML 링크 추가

4. **외부 링크 획득**
   - 소셜 미디어 공유
   - 관련 블로그/포럼에 링크

### ❌ 문제: 일부 페이지만 인덱싱됨

**증상**:
- 홈, 포트폴리오만 인덱싱
- 나머지 페이지는 무시됨

**원인**:
- canonical 태그 오류
- noindex 태그 실수로 설정
- 중복 콘텐츠 감지

**해결 방법**:

1. **메타 태그 확인**
   ```bash
   curl -s https://www.koreaners.co/blog | grep -i "noindex\|canonical"
   ```

2. **중복 콘텐츠 확인**
   - 각 페이지의 title, description 고유성 확인

3. **robots 메타 태그 제거**
   ```html
   <!-- 이런 태그가 있으면 제거 -->
   <meta name="robots" content="noindex">
   ```

---

## Python 스크립트 오류

### ❌ 문제: ModuleNotFoundError

**오류 메시지**:
```
ModuleNotFoundError: No module named 'google'
```

**해결 방법**:
```bash
pip3 install -r scripts/requirements.txt
```

### ❌ 문제: ImportError: cannot import name

**오류 메시지**:
```
ImportError: cannot import name 'create_client' from 'supabase'
```

**원인**:
- supabase-py 버전 불일치

**해결 방법**:
```bash
pip3 install --upgrade supabase
# 또는
pip3 install supabase==2.3.0
```

### ❌ 문제: UnicodeDecodeError

**오류 메시지**:
```
UnicodeDecodeError: 'utf-8' codec can't decode byte
```

**원인**:
- CSV 파일 인코딩 문제

**해결 방법**:
```python
# url_priority_generator.py 수정
# encoding='utf-8' → encoding='utf-8-sig'
with open(filename, 'r', encoding='utf-8-sig') as f:
```

---

## 대시보드 문제

### ❌ 문제: 차트가 표시되지 않음

**증상**:
- 빈 화면 또는 회색 박스만 표시

**원인**:
- Chart.js 로드 실패
- 인터넷 연결 문제
- 브라우저 호환성

**해결 방법**:

1. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - 오류 메시지 확인

2. **Chart.js CDN 확인**
   ```html
   <!-- 다른 버전 시도 -->
   <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
   ```

3. **로컬에서 Chart.js 다운로드**
   ```bash
   curl -o chart.js https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
   # HTML에서 로컬 파일 참조
   ```

### ❌ 문제: 데이터가 업데이트되지 않음

**원인**:
- 샘플 데이터 사용 중
- 실제 데이터 연동 미구현

**해결 방법**:

1. **실제 데이터 연동 (고급)**
   ```javascript
   // indexing_dashboard.html에 API 연동 추가
   async function loadRealData() {
       const response = await fetch('/api/indexing-stats');
       const data = await response.json();
       updateDashboard(data);
   }
   ```

2. **수동 업데이트**
   - `sampleData` 객체 수정
   - 최신 수치로 직접 변경

---

## Vercel 배포 문제

### ❌ 문제: 빌드 실패

**오류 메시지**:
```
Error: Build failed
Type error: ...
```

**해결 방법**:

1. **로컬 빌드 테스트**
   ```bash
   npm run build
   ```

2. **TypeScript 오류 수정**
   ```bash
   npx tsc --noEmit
   ```

3. **node_modules 재설치**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### ❌ 문제: 환경 변수 미적용

**증상**:
- 로컬은 작동하지만 프로덕션 실패

**해결 방법**:

1. **Vercel 환경 변수 확인**
   - Vercel 대시보드 → Settings → Environment Variables

2. **재배포**
   - 환경 변수 변경 후 반드시 재배포

3. **로그 확인**
   - Vercel 대시보드 → Deployments → [배포] → Function Logs

---

## 🆘 긴급 지원

### 1단계: 로그 수집
```bash
# 모든 로그 파일 수집
tar -czf debug_logs.tar.gz \
    indexing_log.json \
    indexing.log \
    seo_health_report.json \
    indexing_report.txt
```

### 2단계: 시스템 상태 확인
```bash
python3 scripts/seo_health_checker.py > system_status.txt
```

### 3단계: 문제 보고
이슈 리포트 양식:

```markdown
## 문제 설명
[문제를 간단히 설명]

## 재현 방법
1. [단계 1]
2. [단계 2]
3. [오류 발생]

## 예상 동작
[무엇이 일어나야 했는지]

## 실제 동작
[실제로 무엇이 일어났는지]

## 환경
- OS: [예: macOS 14.2]
- Python: [예: 3.11.5]
- Node.js: [예: 20.10.0]

## 로그
[오류 메시지 또는 로그 첨부]
```

---

## 💡 일반적인 팁

### 문제 발생 시 체크리스트
1. [ ] 로그 파일 확인
2. [ ] 환경 변수 확인
3. [ ] 인터넷 연결 확인
4. [ ] API 할당량 확인
5. [ ] 최근 코드 변경 확인
6. [ ] Vercel 배포 상태 확인

### 예방 조치
- 주기적으로 백업
- 변경 사항 작게 유지
- 로컬 테스트 후 배포
- 문서화 철저히

### 유용한 명령어
```bash
# 전체 시스템 상태 확인
python3 scripts/seo_health_checker.py

# 로그 실시간 확인
tail -f indexing.log

# Git 변경사항 확인
git diff HEAD~1

# Vercel 로그 확인
vercel logs
```

---

**작성**: 2026-02-11
**마지막 업데이트**: 2026-02-11
**다음 리뷰**: 문제 발생 시 업데이트
