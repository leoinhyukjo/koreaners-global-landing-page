# Portfolio Notion → Supabase Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Notion 포트폴리오 DB를 Supabase와 동기화하는 API를 만들고, 어드민 대시보드에 동기화 버튼을 추가하며, 상세 페이지를 HTML 렌더링으로 전환한다.

**Architecture:** 블로그/크리에이터 sync와 동일한 패턴. `POST /api/sync/portfolio` → Notion 페이지 fetch → `게시` 필터 → `blocksToHtml()` 변환 → Supabase upsert (`notion_id` 기준). 비공개 전환 시 삭제 로직 포함 (크리에이터 패턴).

**Tech Stack:** Next.js 16 (App Router), @notionhq/client, Supabase, Tailwind CSS 4

---

## Task 1: Supabase 스키마 변경 + 환경변수

**Files:**
- Modify: `.env.local` (add NOTION_PORTFOLIO_DB_ID)
- Modify: `.env.example` (add NOTION_PORTFOLIO_DB_ID)

**Step 1: Supabase 마이그레이션 실행**

Supabase Dashboard SQL Editor에서 실행:

```sql
-- 1. notion_id 컬럼 추가 (upsert key)
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS notion_id TEXT UNIQUE;

-- 2. summary 컬럼 추가 (Notion '요약' 필드)
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS summary TEXT;

-- 3. content 컬럼을 TEXT로 변경 (BlockNote JSON → HTML)
-- 기존 데이터가 있다면 먼저 확인: SELECT id, title, content FROM portfolios;
-- 기존 BlockNote JSON 데이터는 동기화 시 HTML로 덮어씌워짐
ALTER TABLE portfolios ALTER COLUMN content TYPE TEXT USING content::TEXT;
```

**Step 2: 환경변수 추가**

`.env.local`에 추가:
```
NOTION_PORTFOLIO_DB_ID=2f501ca3-e480-81d9-92e3-000bad24595b
```

> **주의**: data_source_id를 사용 (DB ID `2f501ca3e48080ce8bf9c3b7606a692d`가 아님). 기존 블로그/크리에이터와 동일 패턴.

`.env.example`에 추가:
```
NOTION_PORTFOLIO_DB_ID=your-notion-portfolio-data-source-id
```

**Step 3: Vercel 환경변수 등록**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
vercel env add NOTION_PORTFOLIO_DB_ID
# 값: 2f501ca3-e480-81d9-92e3-000bad24595b
```

---

## Task 2: Portfolio 타입 업데이트

**Files:**
- Modify: `lib/supabase.ts`

**Step 1: Portfolio 타입에 신규 필드 추가, content 타입 변경**

```typescript
export type Portfolio = {
  id: string;
  title: string;
  client_name: string;
  thumbnail_url: string | null;
  category: string[];
  link: string | null;
  content: string | null; // HTML (이전: BlockNote JSON)
  summary: string | null; // 신규: Notion '요약' 필드
  notion_id: string | null; // 신규: Notion 페이지 ID (upsert key)
  created_at: string;
  // 일본어
  title_jp?: string | null;
  client_name_jp?: string | null;
  content_jp?: any | null;
};
```

**Step 2: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit`
Expected: 타입 변경으로 인한 에러 발생 가능 (content를 Array로 쓰는 곳). Task 4에서 수정.

---

## Task 3: Portfolio Sync API 생성

**Files:**
- Create: `app/api/sync/portfolio/route.ts`

**Step 1: 동기화 API 작성**

블로그 sync (`app/api/sync/blog/route.ts`)와 크리에이터 sync (`app/api/sync/creators/route.ts`)를 결합한 패턴.

핵심 구조:
```
authenticate() → fetchAllPages() → filter(게시=true) →
  for each page:
    extractProperties() + fetchAllBlocks() + blocksToHtml() + resolveImageUrl()
    → upsert to portfolios (onConflict: notion_id)
  → cleanup (비공개 전환 삭제)
```

```typescript
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { notion } from "@/lib/notion/client";
import { blocksToHtml } from "@/lib/notion/blocks-to-html";
import { resolveImageUrl } from "@/lib/notion/image-upload";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────

interface SyncResult {
  synced: number;
  deleted: number;
  errors: string[];
}

// ─── Auth (블로그/크리에이터와 동일) ──────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function authenticate(
  request: NextRequest,
  body: unknown,
): Promise<boolean> {
  const secret = process.env.SYNC_SECRET;

  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (scheme === "Bearer" && token && safeEqual(token, secret)) return true;
    }
  }

  if (
    secret &&
    body &&
    typeof body === "object" &&
    "secret" in body &&
    typeof (body as { secret: string }).secret === "string" &&
    safeEqual((body as { secret: string }).secret, secret)
  ) {
    return true;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (host) {
    const allowedOrigin = `https://${host}`;
    if (origin === allowedOrigin || referer?.startsWith(allowedOrigin)) {
      return true;
    }
    if (
      origin?.startsWith("http://localhost") ||
      referer?.startsWith("http://localhost")
    ) {
      return true;
    }
  }

  if (!secret) {
    console.error("[sync/portfolio] SYNC_SECRET environment variable is not set");
  }

  return false;
}

// ─── Notion Property Extractors ───────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function getTitle(properties: any, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== "title") return "";
  return (prop.title ?? []).map((rt: any) => rt.plain_text ?? "").join("");
}

function getRichText(properties: any, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text ?? []).map((rt: any) => rt.plain_text ?? "").join("");
}

function getSelect(properties: any, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

function getCheckbox(properties: any, key: string): boolean {
  const prop = properties[key];
  if (!prop || prop.type !== "checkbox") return false;
  return prop.checkbox ?? false;
}

function getUrl(properties: any, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== "url") return null;
  return prop.url ?? null;
}

function getFileOrUrl(
  properties: any,
  key: string,
): { type: "file"; file: { url: string } } | { type: "external"; external: { url: string } } | null {
  const prop = properties[key];
  if (!prop) return null;

  if (prop.type === "files" && Array.isArray(prop.files) && prop.files.length > 0) {
    const first = prop.files[0];
    if (first.type === "file" && first.file?.url) {
      return { type: "file", file: { url: first.file.url } };
    }
    if (first.type === "external" && first.external?.url) {
      return { type: "external", external: { url: first.external.url } };
    }
  }

  if (prop.type === "url" && prop.url) {
    return { type: "external", external: { url: prop.url } };
  }

  return null;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Fetch All Blocks (with pagination + recursive children) ──

async function fetchAllBlocks(pageId: string): Promise<any[]> {
  const allBlocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    allBlocks.push(...(response.results ?? []));
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  for (const block of allBlocks) {
    if (block.has_children && block.type !== "child_page" && block.type !== "child_database") {
      block.children = await fetchAllBlocks(block.id);
    }
  }

  return allBlocks;
}

// ─── Fetch All Pages from Notion DB (with pagination) ─────────

async function fetchAllPages(): Promise<any[]> {
  const allPages: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_PORTFOLIO_DB_ID!,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    allPages.push(...(response.results ?? []));
    cursor = response.has_more
      ? (response.next_cursor ?? undefined)
      : undefined;
  } while (cursor);

  return allPages;
}

// ─── POST Handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Body might be empty (auth via header only)
  }

  if (!(await authenticate(request, body))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NOTION_PORTFOLIO_DB_ID) {
    return NextResponse.json(
      { error: "NOTION_PORTFOLIO_DB_ID is not configured" },
      { status: 500 },
    );
  }

  const result: SyncResult = { synced: 0, deleted: 0, errors: [] };

  try {
    console.log("[sync/portfolio] Starting portfolio sync...");

    // 1. Fetch all pages
    const allPages = await fetchAllPages();
    console.log(`[sync/portfolio] Found ${allPages.length} pages in Notion DB`);

    // 2. Filter: 게시 체크박스가 true인 것만
    const publicPages = allPages.filter((page: any) =>
      getCheckbox(page.properties, "게시"),
    );
    console.log(`[sync/portfolio] ${publicPages.length} portfolios marked as public`);

    // 3. Create Supabase admin client
    const supabase = createAdminClient();

    // 4. Collect public Notion IDs for cleanup
    const publicNotionIds: string[] = [];

    // 5. Process each portfolio
    for (const page of publicPages) {
      const portfolioTitle = getTitle(page.properties, "이름") || page.id;

      try {
        console.log(`[sync/portfolio] Processing: "${portfolioTitle}"`);

        const notionId = page.id;
        publicNotionIds.push(notionId);

        // Extract thumbnail
        const thumbnailFile = getFileOrUrl(page.properties, "썸네일");
        const thumbnailUrl = thumbnailFile
          ? await resolveImageUrl(supabase, thumbnailFile)
          : null;

        // Extract other properties
        const title = getTitle(page.properties, "이름");
        const clientName = getRichText(page.properties, "클라이언트명");
        const category = getSelect(page.properties, "카테고리");
        const link = getUrl(page.properties, "링크");
        const summary = getRichText(page.properties, "요약");

        // Fetch blocks and convert to HTML
        const blocks = await fetchAllBlocks(page.id);
        const content = await blocksToHtml(blocks, supabase);

        // Upsert to Supabase
        const { error: upsertError } = await supabase
          .from("portfolios")
          .upsert(
            {
              notion_id: notionId,
              title,
              client_name: clientName,
              thumbnail_url: thumbnailUrl,
              category: category ? [category] : [], // Select → text[] 래핑
              link,
              summary,
              content,
            },
            { onConflict: "notion_id" },
          );

        if (upsertError) {
          console.error(
            `[sync/portfolio] Upsert failed for "${portfolioTitle}":`,
            upsertError.message,
          );
          result.errors.push(`"${portfolioTitle}": ${upsertError.message}`);
          continue;
        }

        result.synced++;
        console.log(`[sync/portfolio] Synced: "${portfolioTitle}"`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[sync/portfolio] Error processing "${portfolioTitle}":`,
          message,
        );
        result.errors.push(`"${portfolioTitle}": ${message}`);
      }
    }

    // 6. Cleanup: Notion에서 비공개 전환된 포트폴리오 삭제 (크리에이터 패턴)
    if (publicNotionIds.length > 0) {
      const { data: existingPortfolios, error: fetchError } = await supabase
        .from("portfolios")
        .select("id, notion_id, title")
        .not("notion_id", "is", null);

      if (fetchError) {
        result.errors.push(`Cleanup fetch failed: ${fetchError.message}`);
      } else if (existingPortfolios) {
        const toDelete = existingPortfolios.filter(
          (p: any) => p.notion_id && !publicNotionIds.includes(p.notion_id),
        );

        if (toDelete.length > 0) {
          const deleteIds = toDelete.map((p: any) => p.id);
          const { error: deleteError } = await supabase
            .from("portfolios")
            .delete()
            .in("id", deleteIds);

          if (deleteError) {
            result.errors.push(`Cleanup delete failed: ${deleteError.message}`);
          } else {
            result.deleted = toDelete.length;
            console.log(
              `[sync/portfolio] Cleaned up ${toDelete.length} portfolios no longer public: ${toDelete.map((p: any) => p.title).join(", ")}`,
            );
          }
        }
      }
    }

    console.log(
      `[sync/portfolio] Sync complete. Synced: ${result.synced}, Deleted: ${result.deleted}, Errors: ${result.errors.length}`,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync/portfolio] Fatal error:", message);
    return NextResponse.json(
      {
        synced: result.synced,
        deleted: result.deleted,
        errors: [...result.errors, `Fatal: ${message}`],
      },
      { status: 500 },
    );
  }
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit`

---

## Task 4: 포트폴리오 상세 페이지 — HTML 렌더링 전환

**Files:**
- Modify: `app/portfolio/[id]/page.tsx`
- Delete: `components/portfolio/portfolio-content-client.tsx` (BlockNote 뷰어)

**Step 1: 상세 페이지에서 BlockNote → HTML 렌더링으로 교체**

현재 상세 페이지(`app/portfolio/[id]/page.tsx`)에서:

1. `PortfolioContentClient` dynamic import 제거
2. content 렌더링을 블로그와 동일한 `dangerouslySetInnerHTML` 방식으로 변경

변경 포인트:

```typescript
// 삭제: BlockNote 관련 import + dynamic loading
// const PortfolioContentClient = dynamic(...)

// 변경: content 렌더링 부분
// 기존:
// const contentToShow = locale === 'ja' && portfolio.content_jp ...
// <PortfolioContentClient portfolio={portfolio} content={contentToShow} />

// 변경 후:
const contentHtml = (locale === 'ja' && portfolio.content_jp && typeof portfolio.content_jp === 'string')
  ? portfolio.content_jp
  : (typeof portfolio.content === 'string' ? portfolio.content : '')
const hasContent = contentHtml.trim().length > 0

// HTML 렌더링:
{hasContent ? (
  <div
    className="prose prose-lg dark:prose-invert max-w-none break-keep text-zinc-200 leading-relaxed text-base lg:text-lg blog-content-prose"
    dangerouslySetInnerHTML={{ __html: contentHtml }}
  />
) : (
  <p className="text-zinc-400">{t('portfolioNoContent')}</p>
)}
```

**Step 2: BlockNote 뷰어 삭제**

```bash
rm components/portfolio/portfolio-content-client.tsx
```

**Step 3: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit`

---

## Task 5: 어드민 대시보드 — 포트폴리오 동기화 버튼 추가

**Files:**
- Modify: `components/admin/dashboard-page.tsx`

**Step 1: 포트폴리오 sync 상태 + 버튼 추가**

변경 사항:

1. `portfolioSyncing` state 추가
2. `handleSync` 함수에 `'portfolio'` 타입 추가
3. stat cards에 포트폴리오 카운트 추가
4. 동기화 버튼 grid를 `grid-cols-3`으로 변경, 포트폴리오 버튼 추가

```typescript
// state 추가
const [portfolioSyncing, setPortfolioSyncing] = useState(false)

// stats에 portfolio 추가
const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, portfolioCount: 0 })

// fetchData에 portfolio count 추가
const portfolioRes = await supabase.from('portfolios').select('id', { count: 'exact', head: true })
setStats({
  ...
  portfolioCount: portfolioRes.count || 0,
})

// handleSync 확장
const handleSync = async (type: 'blog' | 'creator' | 'portfolio') => {
  const setSyncing = type === 'blog' ? setBlogSyncing : type === 'creator' ? setCreatorSyncing : setPortfolioSyncing
  // ...
  const endpoint = type === 'blog' ? 'blog' : type === 'creator' ? 'creators' : 'portfolio'
  const res = await fetch(`/api/sync/${endpoint}`, { method: 'POST' })
  // ...
  const label = type === 'blog' ? '블로그' : type === 'creator' ? '크리에이터' : '포트폴리오'
  // ...
}

// stat cards에 포트폴리오 추가 (Briefcase 아이콘 사용)
import { FileText, Globe, FilePen, RefreshCw, Users, Briefcase } from 'lucide-react'

{ label: '포트폴리오', value: stats.portfolioCount, icon: Briefcase, color: 'text-blue-400' }

// 동기화 버튼 grid: grid-cols-2 → grid-cols-3
// 포트폴리오 동기화 버튼 추가
<button
  onClick={() => handleSync('portfolio')}
  disabled={portfolioSyncing}
  className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
>
  <Briefcase className={`h-4 w-4 ${portfolioSyncing ? 'animate-spin' : ''}`} />
  {portfolioSyncing ? '동기화 중...' : '포트폴리오 동기화'}
</button>
```

**Step 2: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit`

---

## Task 6: 빌드 검증 + 로컬 테스트 + 커밋

**Step 1: 전체 빌드**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
npm run build
```

Expected: 빌드 성공

**Step 2: 로컬 테스트**

```bash
npm run dev
```

확인 사항:
- `/admin` → 포트폴리오 동기화 버튼 표시
- 포트폴리오 동기화 버튼 클릭 → Notion에서 데이터 가져오기
- `/portfolio` → 동기화된 포트폴리오 카드 표시
- `/portfolio/{id}` → HTML 본문 렌더링

**Step 3: 커밋**

```bash
git add app/api/sync/portfolio/route.ts components/admin/dashboard-page.tsx app/portfolio/[id]/page.tsx lib/supabase.ts .env.example
git commit -m "feat: add portfolio Notion→Supabase sync with admin button"
```

---

## 의존성 관계

```
Task 1 (스키마 + 환경변수)
  ↓
Task 2 (타입 업데이트)
  ↓
Task 3 (Sync API 생성)
  ↓
Task 4 (상세 페이지 HTML 전환)
  ↓
Task 5 (어드민 버튼 추가)
  ↓
Task 6 (빌드 + 테스트 + 커밋)
```
