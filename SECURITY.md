# 🔒 보안 정책

**프로젝트**: Koreaners Global Landing Page
**버전**: 1.0.0
**최종 업데이트**: 2026-02-12

---

## 📋 목차

1. [구현된 보안 조치](#구현된-보안-조치)
2. [보안 테스트 체크리스트](#보안-테스트-체크리스트)
3. [환경 변수 관리](#환경-변수-관리)
4. [보안 이슈 보고](#보안-이슈-보고)
5. [정기 보안 점검](#정기-보안-점검)

---

## 구현된 보안 조치

### ✅ 인증 및 인가

#### Admin 경로 보호
- **Middleware 기반 인증** (`middleware.ts`)
  - 서버 측 세션 검증
  - 미인증 사용자 자동 리다이렉트
  - `/admin/*` 경로 전체 보호

- **이중 보호 (Defense in Depth)**
  - Middleware: 초기 인증 체크
  - Layout: 서버 컴포넌트 레벨 검증

#### Supabase RLS (Row Level Security)
- 모든 테이블에 RLS 활성화
- Public: 읽기 전용 (published 콘텐츠만)
- Admin: 전체 CRUD 권한 (인증된 사용자)
- SQL 정책: `supabase-rls-policies.sql` 참고

### ✅ XSS (Cross-Site Scripting) 방어

1. **innerHTML 제거**
   - `components/performance.tsx`: 안전한 DOM 조작으로 변경
   - `textContent` 사용으로 스크립트 삽입 차단

2. **JSON-LD Injection 방어**
   - `lib/json-ld.ts`: 안전한 직렬화 유틸리티
   - `</script>` 태그 이스케이프

3. **입력 검증 강화 (Zod)**
   - `lib/validation/blog-schema.ts`: XSS 패턴 감지
   - 정규식 기반 악성 스크립트 차단

### ✅ CSRF (Cross-Site Request Forgery) 방어

- **CSRF 토큰 시스템** (`lib/csrf.ts`)
  - HttpOnly + SameSite=Strict 쿠키
  - 커스텀 헤더 검증 (X-CSRF-Token)
  - 프로덕션 환경에서 활성화

- **API 엔드포인트 보호**
  - `/api/notion`: CSRF 토큰 필수
  - 클라이언트: `lib/api-client.ts`로 자동 토큰 포함

### ✅ Rate Limiting

- **메모리 기반 Rate Limiter** (`lib/rate-limit.ts`)
  - 분당 5회 제한
  - IP 기반 식별
  - 429 응답 + Retry-After 헤더

- **프로덕션 권장: Upstash Redis**
  ```bash
  UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
  UPSTASH_REDIS_REST_TOKEN=xxx
  ```

### ✅ 파일 업로드 보안

- **다층 검증** (`components/admin/blog-dialog.tsx`)
  1. MIME type 검증 (image/jpeg, png, webp, gif)
  2. 파일 크기 제한 (5MB)
  3. 확장자 화이트리스트
  4. 파일명 안전 처리 (crypto.randomUUID)
  5. 경로 조작 방지 (하드코딩)

### ✅ SQL Injection 방어

- **Supabase 타입세이프 쿼리 빌더 사용**
  - 직접 SQL 쿼리 없음
  - 모든 DB 작업이 파라미터화됨

### ✅ 민감 정보 보호

1. **환경 변수 분리**
   - `.env.local` (Git 제외)
   - `.env.example` (템플릿만 포함)
   - `.gitignore` 검증 완료

2. **로깅 시스템** (`lib/logger.ts`)
   - 프로덕션: console.log 자동 제거
   - 민감 데이터 마스킹
   - 에러 메시지 sanitization

3. **에러 응답 제한**
   - 프로덕션: 일반 메시지만 반환
   - 개발: 상세 디버그 정보 포함

### ✅ 이미지 최적화 보안

- **원격 도메인 제한**
  - Supabase Storage만 허용
  - `**` 와일드카드 제거
  - SSRF 공격 벡터 최소화

---

## 보안 테스트 체크리스트

### 🔴 Critical 테스트

- [ ] **Admin 인증 우회 시도**
  ```bash
  # JavaScript 비활성화 후 /admin 접근
  # 예상: 로그인 페이지로 리다이렉트
  ```

- [ ] **XSS 공격 시뮬레이션**
  ```javascript
  // 블로그 제목에 입력
  <script>alert('XSS')</script>
  // 예상: 검증 실패 또는 이스케이프됨
  ```

- [ ] **CSRF 공격 테스트**
  ```bash
  # CSRF 토큰 없이 POST 요청
  curl -X POST https://koreaners.co/api/notion \
    -H "Content-Type: application/json" \
    -d '{"name":"test"}'
  # 예상: 403 Forbidden
  ```

### 🟠 High 테스트

- [ ] **Rate Limiting 검증**
  ```bash
  # 연속 6회 요청
  for i in {1..6}; do
    curl https://koreaners.co/api/notion -X POST
  done
  # 예상: 6번째 요청에서 429 에러
  ```

- [ ] **파일 업로드 악성 파일**
  - .php, .exe, .sh 파일 업로드 시도
  - 5MB 초과 파일 업로드 시도
  - 예상: 에러 메시지 및 업로드 실패

- [ ] **Supabase RLS 검증**
  ```javascript
  // 비로그인 상태에서
  await supabase.from('blog_posts').delete().eq('id', 1)
  // 예상: 권한 에러
  ```

### 🟡 Medium 테스트

- [ ] **환경 변수 노출 확인**
  - 브라우저 DevTools → Network → 응답 검사
  - NOTION_TOKEN, Supabase Service Key 노출 여부

- [ ] **에러 메시지 정보 노출**
  - 잘못된 API 요청 시 내부 경로 노출 확인
  - 프로덕션: 일반 메시지만 표시되어야 함

---

## 환경 변수 관리

### 필수 환경 변수

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Notion (Server-only)
NOTION_TOKEN=ntn_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxx

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=xxxxxxxxxx
```

### 보안 원칙

1. **절대 Git에 커밋하지 말 것**
   - `.env.local`, `.env.production.local`
   - 토큰, API 키, 비밀번호

2. **Vercel 환경 변수 사용**
   - Dashboard → Settings → Environment Variables
   - Production, Preview, Development 분리

3. **토큰 재발급 주기**
   - Notion: 6개월마다
   - Supabase: 노출 의심 시 즉시

---

## 보안 이슈 보고

보안 취약점을 발견하신 경우:

1. **공개 이슈 생성하지 말 것**
2. **이메일로 비공개 보고**: security@koreaners.co
3. **포함 정보**:
   - 취약점 설명
   - 재현 단계
   - 영향 범위
   - 제안 해결책 (선택)

4. **응답 시간**: 48시간 이내

---

## 정기 보안 점검

### 월간 점검 (매월 1일)

- [ ] 환경 변수 로테이션 검토
- [ ] Rate Limit 로그 분석
- [ ] Supabase RLS 정책 검증
- [ ] 의존성 취약점 스캔 (`npm audit`)

### 분기별 점검 (분기 첫 주)

- [ ] 전체 보안 테스트 수행
- [ ] 침투 테스트 (선택)
- [ ] 보안 정책 문서 업데이트
- [ ] 팀 보안 교육

### 즉시 조치 필요 시

- 의존성 Critical 취약점 발견
- 토큰 노출 의심
- 비정상 접근 로그 감지
- 새로운 OWASP Top 10 발표

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/authentication)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)

---

**마지막 업데이트**: 2026-02-12
**작성자**: Claude Code AI Agent
**검토**: 보안 팀 검토 필요
