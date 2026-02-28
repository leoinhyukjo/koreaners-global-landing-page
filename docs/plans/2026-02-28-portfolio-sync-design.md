# Portfolio Notion → Supabase Sync 설계

**날짜**: 2026-02-28
**상태**: 승인됨
**이전 설계**: `2026-02-28-notion-portfolio-auto-posting-design.md` (ISR 방식 → 폐기, Supabase 동기화 방식으로 전환)

## 요약

기존 블로그/크리에이터와 동일한 패턴으로 Notion DB → Supabase 동기화 API를 구현하고, 어드민 대시보드에 동기화 버튼을 추가한다.

## 아키텍처

```
Notion DB (📓 포트폴리오 포스트)
  ↓ [POST /api/sync/portfolio]
  ↓ [게시 ✓ 체크박스 필터링]
  ↓ [fetchAllBlocks → blocksToHtml 변환]
  ↓ [resolveImageUrl → Supabase Storage]
  ↓ [upsert to portfolios (notion_id 기준)]
  ↓ [비공개 전환 시 삭제]
Supabase `portfolios` 테이블
```

## Notion DB 스키마

| 속성 | 타입 | Supabase 매핑 |
|------|------|---------------|
| 이름 | Title | `title` |
| 클라이언트명 | Text | `client_name` |
| 썸네일 | Files & media | `thumbnail_url` (resolveImageUrl) |
| 카테고리 | Select | `category` (text[] 래핑) |
| 링크 | URL | `link` |
| 요약 | Text | `summary` (신규 컬럼) |
| 게시 | Checkbox | 동기화 필터 (true만 동기화) |
| 페이지 본문 | Notion Blocks | `content` (HTML 변환) |

**Notion Data Source ID**: `2f501ca3-e480-81d9-92e3-000bad24595b`

## Supabase 스키마 변경

```sql
-- portfolios 테이블 변경
ALTER TABLE portfolios ADD COLUMN notion_id TEXT UNIQUE;
ALTER TABLE portfolios ADD COLUMN summary TEXT;
ALTER TABLE portfolios ALTER COLUMN content TYPE TEXT;  -- JSONB → TEXT (HTML)
```

## 코드 변경

### 신규 파일
- `app/api/sync/portfolio/route.ts` — 동기화 API (블로그/크리에이터 패턴 재사용)

### 수정 파일
- `components/admin/dashboard-page.tsx` — 포트폴리오 sync 버튼 + stat card 추가
- `app/portfolio/[id]/page.tsx` — BlockNote → HTML 렌더링으로 전환
- `lib/supabase.ts` — Portfolio 타입에 `notion_id`, `summary` 추가, `content` 타입 변경
- `.env.local` — `NOTION_PORTFOLIO_DB_ID` 추가

### 삭제 파일
- `components/portfolio/portfolio-content-client.tsx` — BlockNote 뷰어 (불필요)

## 기존 sync 코드에서 재사용

| 모듈 | 출처 | 용도 |
|------|------|------|
| `authenticate()` | blog/creators | 인증 (Bearer + body + same-origin) |
| `getTitle/getRichText/getSelect/getCheckbox/getFileOrUrl` | blog/creators | Notion 속성 추출 |
| `fetchAllBlocks()` | blog | 페이지 본문 블록 fetch + 재귀 children |
| `blocksToHtml()` | blog | Notion 블록 → HTML 변환 |
| `resolveImageUrl()` | blog/creators | 이미지 → Supabase Storage |
| cleanup 로직 | creators | 비공개 전환 시 삭제 |

## 블로그 sync에서의 교훈 (시행착오 방지)

1. **upsert key**: 블로그는 `slug`, 크리에이터는 `notion_id` → 포트폴리오는 `notion_id` 사용
2. **env var에 data_source_id 사용**: DB ID가 아닌 data_source_id (`2f501ca3-e480-81d9-92e3-000bad24595b`)
3. **maxDuration = 60**: Vercel serverless timeout 대응
4. **env var .trim()**: Vercel 환경변수 trailing `\n` 방어
5. **카테고리 타입 변환**: Notion Select (단일) → Supabase text[] (배열) → `[category]` 래핑
6. **이미지 URL 만료**: Notion file URL은 1시간 만료 → resolveImageUrl로 Supabase Storage에 영구 저장
