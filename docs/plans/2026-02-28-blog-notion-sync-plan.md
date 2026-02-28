# Blog Notion → Supabase 동기화 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Notion DB에서 블로그 글을 작성하면 수동 동기화 버튼으로 Supabase에 반영되어 웹사이트에 표시되게 한다.

**Architecture:** Notion API로 DB 쿼리 + 페이지 블록 가져오기 → Notion 블록을 HTML로 변환 (이미지는 Supabase Storage로 복사) → FAQ 섹션 파싱 → Supabase upsert. 어드민 페이지에 동기화 버튼 제공.

**Tech Stack:** @notionhq/client, Next.js API Routes, Supabase, DOMPurify (XSS 방어)

---

## Task 1: Notion DB 스키마 확장

Notion MCP를 사용하여 📝 블로그 포스트 DB에 속성 추가. 코드 변경 아님.

**Step 1: Notion DB에 속성 추가**

Notion MCP `update-data-source`로 다음 속성 추가:
- 상태 (select): 초안, 발행, 비공개
- 슬러그 (text)
- 요약 (text)
- 썸네일 (url)
- Meta Title (text)
- Meta Description (text)

data_source_id: `2f501ca3-e480-81ed-ac89-000babe4a50c`

**Step 2: 확인**

Notion MCP `fetch`로 DB 스키마 확인. 모든 속성이 추가되었는지 검증.

---

## Task 2: @notionhq/client 설치 + 환경변수

**Files:**
- Modify: `package.json`

**Step 1: 패키지 설치**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
npm install @notionhq/client
```

**Step 2: 환경변수 추가**

`.env.local`에 추가:
```
NOTION_API_KEY=<Notion Integration Token>
NOTION_BLOG_DB_ID=2f501ca3e4808082aae4f046911ccf9b
SYNC_SECRET=<랜덤 시크릿 생성>
```

Vercel에도 동일하게 설정 필요.

---

## Task 3: Notion 블록 → HTML 변환 유틸리티

**Files:**
- Create: `lib/notion/client.ts`
- Create: `lib/notion/blocks-to-html.ts`
- Create: `lib/notion/parse-faqs.ts`

**Step 1: Notion 클라이언트**

`lib/notion/client.ts`:
```typescript
import { Client } from '@notionhq/client'

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})
```

**Step 2: 블록 → HTML 변환기**

`lib/notion/blocks-to-html.ts`:

Notion 블록 타입별 HTML 변환:
- paragraph → `<p>`
- heading_1/2/3 → `<h1>/<h2>/<h3>`
- bulleted_list_item → `<ul><li>`
- numbered_list_item → `<ol><li>`
- image → `<img>` (Supabase Storage URL로 교체)
- code → `<pre><code>`
- quote → `<blockquote>`
- table → `<table>`
- divider → `<hr>`
- toggle → `<details><summary>`

이미지 처리:
- Notion 이미지 URL 감지 (type: "file" → 임시 URL, type: "external" → 영구 URL)
- 임시 URL이면 다운로드 → Supabase Storage 업로드 → 영구 URL로 교체
- 캐시: 이미 업로드된 이미지는 스킵 (파일명 해시로 중복 체크)

**Step 3: FAQ 파싱**

`lib/notion/parse-faqs.ts`:

Notion 블록 배열에서 `## FAQ` 또는 `## 자주 묻는 질문` 이후의 블록을 파싱.
볼드 텍스트(`**Q. ...**`)를 질문으로, 그 아래 일반 텍스트를 답변으로 추출.

```typescript
export function parseFaqsFromBlocks(blocks: any[]): { question: string; answer: string }[]
```

---

## Task 4: 동기화 API Route

**Files:**
- Create: `app/api/sync/blog/route.ts`

**Step 1: API Route 구현**

`app/api/sync/blog/route.ts`:

```typescript
// POST /api/sync/blog
// Header: Authorization: Bearer {SYNC_SECRET}
// 또는 Body: { secret: string }

export async function POST(request: Request) {
  // 1. 인증 확인
  // 2. Notion DB 쿼리 (전체 글)
  // 3. 각 글 처리:
  //    a. 속성 매핑 (이름→title, 슬러그→slug, 상태→published 등)
  //    b. 페이지 블록 가져오기
  //    c. 블록 → HTML 변환 (이미지 Supabase Storage 복사 포함)
  //    d. FAQ 파싱
  //    e. Supabase upsert (slug 기준)
  // 4. 결과 반환
}
```

매핑 규칙:
- Notion `상태` = "발행" → `published: true`, 그 외 → `published: false`
- Notion `이름` → `title`
- Notion `슬러그` → `slug` (빈칸이면 제목에서 자동 생성)
- Notion `카테고리` → `category` (multi_select의 첫 번째 값)
- Notion `요약` → `summary`
- Notion `썸네일` → `thumbnail_url`
- Notion `Meta Title` → `meta_title`
- Notion `Meta Description` → `meta_description`
- Notion `발행일` → `created_at` (없으면 Notion 생성일)
- 변환된 HTML → `content`
- 파싱된 FAQ → `faqs`

Supabase upsert: `slug`을 unique key로 사용. slug가 같은 기존 행 업데이트, 없으면 신규 삽입.

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

---

## Task 5: 콘텐츠 렌더러 변경 (BlockNote → HTML)

**Files:**
- Modify: `components/blog/blog-content.tsx`
- Modify: `components/blog/blog-content-client.tsx` (또는 삭제)

**Step 1: blog-content.tsx를 HTML 렌더러로 교체**

content가 HTML 문자열이면 `dangerouslySetInnerHTML`로 렌더링 (prose 스타일).
content가 배열(기존 BlockNote JSON)이면 기존 BlockNote 렌더러 사용 (하위 호환).

```tsx
export function BlogContent({ blogPost, content }: BlogContentProps) {
  const rawContent = content ?? blogPost?.content

  // HTML 문자열인 경우
  if (typeof rawContent === 'string') {
    return (
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: rawContent }}
      />
    )
  }

  // 기존 BlockNote JSON인 경우 (하위 호환)
  const blocks = Array.isArray(rawContent) ? rawContent : []
  if (blocks.length === 0) {
    return <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
  }
  return <BlogContentClient blogPost={blogPost} content={blocks} />
}
```

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

---

## Task 6: 어드민 블로그 리스트에 동기화 버튼 추가

**Files:**
- Modify: `components/admin/blog-list-page.tsx`

**Step 1: 동기화 버튼 + 상태 표시 추가**

"새 포스트 작성" 버튼 옆에 "Notion 동기화" 버튼 추가:

```tsx
const [syncing, setSyncing] = useState(false)
const [syncResult, setSyncResult] = useState<string | null>(null)

async function handleSync() {
  setSyncing(true)
  setSyncResult(null)
  try {
    const res = await fetch('/api/sync/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_SYNC_SECRET }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '동기화 실패')
    setSyncResult(`동기화 완료: ${data.synced}개 글 반영`)
    fetchBlogPosts() // 목록 새로고침
  } catch (err: any) {
    setSyncResult(`에러: ${err.message}`)
  } finally {
    setSyncing(false)
  }
}
```

UI:
```tsx
<Button onClick={handleSync} disabled={syncing} variant="outline">
  {syncing ? '동기화 중...' : 'Notion 동기화'}
</Button>
{syncResult && <p className="text-sm text-zinc-400">{syncResult}</p>}
```

**참고**: SYNC_SECRET을 클라이언트에서 직접 보내는 대신, 서버사이드 API Route를 경유하거나 어드민 인증 세션을 활용하는 게 더 안전. 현재 어드민은 Supabase Auth로 보호되어 있으므로, 동기화 API에서 Supabase Auth 세션 확인으로 대체 가능.

**Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공

---

## Task 7: Supabase blog_posts 테이블에 unique 제약조건 추가

**Files:**
- Create: `supabase/migrations/add-blog-slug-unique.sql`

**Step 1: slug unique 제약조건**

```sql
-- upsert를 위해 slug에 unique 제약조건 추가 (이미 없다면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_slug_key'
  ) THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);
  END IF;
END $$;
```

**Step 2: Supabase Dashboard에서 실행**

---

## 실행 순서

```
Task 1 (Notion DB 스키마) → Task 2 (패키지 + 환경변수) → Task 3 (변환 유틸) → Task 4 (API Route) → Task 5 (렌더러) → Task 6 (어드민 버튼) → Task 7 (DB 제약조건)
```

Task 1, 2, 7은 설정 작업 (코드 외).
Task 3, 4가 핵심 구현.
Task 5, 6은 프론트 연동.
