# 🔧 상세 설정 가이드

koreaners.co SEO 인덱싱 최적화를 위한 전체 설정 가이드입니다.

---

## 📑 목차
1. [환경 준비](#환경-준비)
2. [Google Cloud Console 설정](#google-cloud-console-설정)
3. [Google Search Console 설정](#google-search-console-설정)
4. [프로젝트 설정](#프로젝트-설정)
5. [자동화 설정](#자동화-설정)
6. [모니터링 설정](#모니터링-설정)

---

## 환경 준비

### 1. 필수 소프트웨어 설치

#### Python 3.8+
```bash
# macOS
brew install python3

# 버전 확인
python3 --version
```

#### Node.js 18+
```bash
# macOS
brew install node

# 버전 확인
node --version
npm --version
```

#### Git
```bash
# macOS (보통 pre-installed)
git --version

# 설치 필요 시
brew install git
```

### 2. Python 패키지 설치

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts

# requirements.txt 설치
pip3 install -r requirements.txt

# 설치 확인
python3 -c "import google.auth; print('Google API OK')"
python3 -c "import openpyxl; print('Excel OK')"
```

**requirements.txt 내용**:
```txt
google-auth==2.27.0
google-auth-oauthlib==1.2.0
google-auth-httplib2==0.2.0
google-api-python-client==2.115.0
openpyxl==3.1.2
supabase==2.3.0
requests==2.31.0
python-dotenv==1.0.0
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:
```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF
```

**보안 주의**: `.env.local`을 Git에 커밋하지 마세요!

---

## Google Cloud Console 설정

### 1. 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단 프로젝트 선택 드롭다운 → "새 프로젝트"
3. 프로젝트 정보 입력:
   - **프로젝트 이름**: `koreaners-seo`
   - **프로젝트 ID**: `koreaners-seo-[랜덤]` (자동 생성)
   - **조직**: (없음 또는 선택)
4. "만들기" 클릭

### 2. Google Indexing API 활성화

1. 좌측 메뉴 → "API 및 서비스" → "라이브러리"
2. 검색창에 "Indexing API" 입력
3. "Indexing API" 선택
4. "사용" 버튼 클릭
5. API가 활성화될 때까지 대기 (약 1분)

### 3. 서비스 계정 생성

1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. 상단 "사용자 인증 정보 만들기" → "서비스 계정"
3. 서비스 계정 세부정보:
   - **서비스 계정 이름**: `koreaners-indexing-bot`
   - **서비스 계정 ID**: `koreaners-indexing-bot` (자동 생성)
   - **설명**: "SEO 인덱싱 자동화용 봇"
4. "만들기 및 계속하기" 클릭
5. 역할 선택:
   - "프로젝트" → "소유자" 선택
   - "계속" 클릭
6. "완료" 클릭

### 4. 서비스 계정 키 생성

1. 생성된 서비스 계정 클릭
2. 상단 "키" 탭 선택
3. "키 추가" → "새 키 만들기"
4. 키 유형: "JSON" 선택
5. "만들기" 클릭
6. JSON 파일 자동 다운로드

### 5. 키 파일 배치

```bash
# 다운로드한 JSON 파일을 scripts 폴더로 복사
cp ~/Downloads/koreaners-seo-*.json \
   /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/scripts/credentials.json

# 권한 설정 (보안)
chmod 600 scripts/credentials.json

# 확인
cat scripts/credentials.json | python3 -m json.tool
```

**중요**: `credentials.json`을 Git에 커밋하지 마세요!

---

## Google Search Console 설정

### 1. Search Console 속성 추가

1. [Google Search Console](https://search.google.com/search-console) 접속
2. "속성 추가" 클릭
3. 속성 유형: "URL 접두어"
4. URL 입력: `https://www.koreaners.co`
5. "계속" 클릭

### 2. 소유권 확인

**방법 1: DNS 확인 (권장)**
1. "DNS 레코드" 선택
2. TXT 레코드 값 복사
3. 도메인 등록기관 관리 페이지 접속
4. DNS 설정에 TXT 레코드 추가:
   ```
   Type: TXT
   Name: @
   Value: google-site-verification=...
   ```
5. Search Console로 돌아가서 "확인" 클릭

**방법 2: HTML 파일 (이미 설정된 경우)**
1. "HTML 파일" 선택
2. 파일 다운로드
3. `public/` 폴더에 배치
4. Git 커밋 및 푸시
5. Vercel 배포 후 "확인" 클릭

### 3. 서비스 계정 권한 부여

1. Search Console → 설정 (톱니바퀴 아이콘)
2. "사용자 및 권한" 선택
3. "사용자 추가" 클릭
4. 이메일 주소 입력:
   ```
   koreaners-indexing-bot@koreaners-seo-[ID].iam.gserviceaccount.com
   ```
   (Google Cloud Console → 서비스 계정에서 확인)
5. 권한: "소유자" 선택
6. "추가" 클릭

### 4. 사이트맵 제출

1. Search Console → 색인 → 사이트맵
2. "새 사이트맵 추가" 입력란에 입력:
   ```
   https://www.koreaners.co/sitemap.xml
   ```
3. "제출" 클릭
4. 상태가 "성공"으로 변경될 때까지 대기 (수 분 소요)

---

## 프로젝트 설정

### 1. Next.js 프로젝트 설정

#### robots.txt 배치
```bash
# 이미 생성되어 있음
cat public/robots.txt
```

내용:
```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://www.koreaners.co/sitemap.xml
```

#### sitemap.ts 설정
```bash
# 이미 생성되어 있음
cat app/sitemap.ts
```

### 2. 로컬 테스트

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
open http://localhost:3000/robots.txt
open http://localhost:3000/sitemap.xml
```

### 3. 프로덕션 배포

```bash
# 변경사항 확인
git status

# 커밋
git add .
git commit -m "Add SEO optimization: robots.txt and sitemap"

# 푸시 (Vercel 자동 배포)
git push origin main
```

### 4. 배포 확인

1. [Vercel 대시보드](https://vercel.com/) 접속
2. 프로젝트 선택
3. Deployments → 최신 배포 확인
4. "Visit" 클릭하여 사이트 확인

브라우저에서:
```
https://www.koreaners.co/robots.txt
https://www.koreaners.co/sitemap.xml
```

---

## 자동화 설정

### 1. URL 우선순위 목록 생성

```bash
python3 scripts/url_priority_generator.py
```

생성되는 파일:
- `url_priority_list.csv`
- `indexing_schedule.xlsx`

### 2. 첫 색인 요청 실행

```bash
python3 scripts/indexing_automation.py
```

**초기 실행 시**:
- 10개 URL 자동 선택 (우선순위 기반)
- Google Indexing API 호출
- 로그 파일 생성

### 3. Cron Job 설정 (선택)

매일 자동 실행:

```bash
# crontab 편집
crontab -e

# 다음 줄 추가 (매일 오전 9시 실행)
0 9 * * 1-5 cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && /usr/bin/python3 scripts/indexing_automation.py >> logs/cron.log 2>&1
```

### 4. 로그 디렉토리 생성

```bash
mkdir -p logs
```

---

## 모니터링 설정

### 1. 대시보드 설정

대시보드 파일은 이미 생성되어 있습니다:
```bash
open indexing_dashboard.html
```

### 2. Google Analytics 연동 (선택)

1. [Google Analytics](https://analytics.google.com/) 접속
2. 계정 → 속성 → 데이터 스트림
3. "측정 ID" 복사 (G-XXXXXXXXXX)
4. `app/layout.tsx`에 추가:
   ```typescript
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
     strategy="afterInteractive"
   />
   ```

### 3. 알림 설정

#### Search Console 이메일 알림
1. Search Console → 설정 → 이메일 알림
2. 모든 알림 체크
3. 저장

#### Slack/Discord 웹훅 (선택)
```python
# scripts/indexing_automation.py에 추가
import requests

SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

def send_slack_notification(message):
    requests.post(SLACK_WEBHOOK_URL, json={'text': message})

# 알림 전송
send_slack_notification(f'✅ 인덱싱 완료: {processed}개 URL')
```

---

## 🔒 보안 설정

### 1. 민감 파일 보호

`.gitignore`에 추가:
```bash
# 이미 추가되어 있어야 함
credentials.json
indexing_log.json
*.log
.env.local
```

### 2. 권한 설정

```bash
# 민감 파일 권한 제한
chmod 600 scripts/credentials.json
chmod 600 .env.local
```

### 3. 환경 변수 검증

```bash
# .env.local 확인
cat .env.local

# Vercel 환경 변수 확인
vercel env ls
```

---

## ✅ 설정 완료 체크리스트

### Google Cloud
- [ ] 프로젝트 생성
- [ ] Indexing API 활성화
- [ ] 서비스 계정 생성
- [ ] JSON 키 다운로드 및 배치

### Google Search Console
- [ ] 속성 추가 및 소유권 확인
- [ ] 서비스 계정 권한 부여
- [ ] 사이트맵 제출

### 프로젝트
- [ ] Python 패키지 설치
- [ ] 환경 변수 설정
- [ ] robots.txt 배포
- [ ] sitemap.xml 배포
- [ ] 로컬 테스트 완료
- [ ] 프로덕션 배포 완료

### 자동화
- [ ] URL 우선순위 목록 생성
- [ ] 첫 색인 요청 실행
- [ ] 로그 파일 확인
- [ ] Cron job 설정 (선택)

### 모니터링
- [ ] 대시보드 확인
- [ ] Search Console 알림 설정
- [ ] Google Analytics 연동 (선택)

---

## 🆘 문제 발생 시

각 단계에서 문제가 발생하면:
1. `TROUBLESHOOTING.md` 참고
2. 로그 파일 확인
3. 오류 메시지 검색

---

## 📚 참고 자료

- [Google Indexing API 문서](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- [Next.js SEO 가이드](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google Search Console 고급 가이드](https://developers.google.com/search/docs/advanced/guidelines/get-started)

---

**작성**: 2026-02-11
**예상 소요 시간**: 45-60분
**난이도**: 중급
