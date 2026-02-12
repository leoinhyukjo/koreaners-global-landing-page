# Changelog

모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 기반으로 하며,
버전 관리는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

---

## [1.1.0] - 2026-02-12

### 🔒 보안 (Security)

#### Added
- **Middleware 기반 Admin 인증 보호** (`middleware.ts`)
  - 서버 측 세션 검증
  - 미인증 사용자 자동 리다이렉트
  - Admin Layout 이중 보호 추가

- **CSRF 보호 시스템** (`lib/csrf.ts`)
  - HttpOnly + SameSite=Strict 쿠키
  - X-CSRF-Token 헤더 검증
  - `/api/csrf-token` 엔드포인트
  - `postWithCsrf` API 클라이언트 헬퍼

- **Rate Limiting** (`lib/rate-limit.ts`)
  - 메모리 기반 Rate Limiter (분당 5회)
  - IP 기반 식별 및 제한
  - Rate Limit 헤더 응답 (X-RateLimit-*)
  - Upstash Redis 통합 준비

- **입력 검증 강화** (`lib/validation/blog-schema.ts`)
  - Zod 스키마 기반 검증
  - XSS 패턴 감지 정규식
  - 길이 제한 및 타입 검증

- **파일 업로드 보안** (`components/admin/blog-dialog.tsx`)
  - MIME type 검증 (image/* 만)
  - 파일 크기 제한 (5MB)
  - 확장자 화이트리스트
  - 파일명 안전 처리 (crypto.randomUUID)

- **Supabase RLS 정책** (`supabase-rls-policies.sql`)
  - 모든 테이블 RLS 활성화
  - Public 읽기 전용 정책
  - Admin 전체 권한 정책
  - Inquiries/Applications 분리 정책

#### Fixed
- **XSS 취약점 수정** (`components/performance.tsx`)
  - `innerHTML` 사용 제거
  - 안전한 DOM 조작으로 변경 (textContent 사용)

- **JSON-LD Injection 방어** (`lib/json-ld.ts`, `app/blog/[slug]/page.tsx`)
  - `safeJsonLdStringify` 헬퍼 함수 추가
  - `</script>` 태그 이스케이프

- **에러 메시지 Sanitization** (`app/api/notion/route.ts`)
  - 프로덕션 환경에서 내부 에러 정보 숨김
  - 개발 환경에서만 상세 디버그 정보 제공

### ⚡ 성능 (Performance)

#### Added
- **이미지 최적화 활성화** (`next.config.mjs`)
  - `unoptimized: false`로 변경
  - AVIF/WebP 포맷 지원
  - remotePatterns 제한 (Supabase만 허용)

- **번들 사이즈 최적화**
  - optimizePackageImports 확장 (9개 패키지)
  - Tree shaking 개선

- **로깅 시스템** (`lib/logger.ts`)
  - 환경별 로그 레벨 제어
  - 민감 데이터 마스킹
  - 성능 측정 유틸리티

#### Changed
- **console.log 자동 제거** (`next.config.mjs`)
  - 프로덕션 빌드 시 자동 제거
  - error, warn만 유지 (Sentry 연동 준비)

### 🎨 코드 품질 (Code Quality)

#### Added
- **TypeScript Strict Mode 강화** (`tsconfig.json`)
  - `noUncheckedIndexedAccess`: 배열/객체 undefined 체크
  - `noUnusedLocals`: 사용하지 않는 변수 경고
  - `noUnusedParameters`: 사용하지 않는 파라미터 경고
  - `noFallthroughCasesInSwitch`: switch fallthrough 방지
  - `forceConsistentCasingInFileNames`: 파일명 일관성

#### Changed
- **환경 변수화** (`app/layout.tsx`, `.env.example`)
  - GA ID 하드코딩 제거 → `NEXT_PUBLIC_GA_ID`
  - FB Pixel ID 하드코딩 제거 → `NEXT_PUBLIC_FB_PIXEL_ID`
  - 조건부 렌더링으로 선택적 로드

### ♿ 접근성 (Accessibility)

#### Added
- **autocomplete 속성 추가** (`components/footer-cta.tsx`)
  - company → `organization`
  - position → `organization-title`
  - email → `email`
  - phone → `tel`

### 📝 문서화 (Documentation)

#### Added
- `SECURITY.md` - 보안 정책 및 테스트 가이드
- `CHANGELOG.md` - 변경사항 기록
- `supabase-rls-policies.sql` - RLS 정책 SQL 스크립트
- `lib/json-ld.ts` - JSON-LD 안전 직렬화 문서화
- `lib/csrf.ts` - CSRF 보호 시스템 문서화
- `lib/rate-limit.ts` - Rate Limiting 문서화
- `lib/logger.ts` - 로깅 시스템 문서화
- `lib/api-client.ts` - API 클라이언트 문서화
- `lib/validation/blog-schema.ts` - 입력 검증 스키마 문서화

#### Updated
- `.env.example` - 새로운 환경 변수 추가
- `README.md` - 보안 섹션 업데이트 (권장)

---

## [1.0.0] - 2026-01-29

### Added
- 초기 프로젝트 설정
- Next.js 16 App Router
- Supabase 통합
- Notion API 연동
- Admin 대시보드
- 블로그 시스템
- SEO 최적화 (sitemap, robots.txt)

---

## 버전 관리 규칙

### Major (X.0.0)
- 호환되지 않는 API 변경
- 주요 아키텍처 변경

### Minor (0.X.0)
- 새로운 기능 추가 (하위 호환)
- 기존 기능 개선
- 보안 강화

### Patch (0.0.X)
- 버그 수정
- 문서 업데이트
- 마이너 개선

---

**마지막 업데이트**: 2026-02-12
**작성자**: Claude Code AI Agent
