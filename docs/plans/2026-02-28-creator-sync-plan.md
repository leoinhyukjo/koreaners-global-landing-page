# Creator Sync + Admin Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 크리에이터 Notion→Supabase 동기화 API 구축 + 어드민을 대시보드 단일 페이지로 통합 (통계 + 동기화 버튼 2개)

**Architecture:** 블로그 sync API 패턴을 그대로 복제하여 크리에이터 sync API 생성. 어드민은 블로그 페이지를 제거하고 대시보드에 동기화 버튼을 통합.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + Storage), Notion API, Tailwind CSS v4

---

## Task 1: Supabase creators 테이블 스키마 업데이트

**Files:**
- Modify: `supabase-schema.sql` (문서용 기록)

**Step 1: Supabase에 컬럼 추가**

Supabase Dashboard 또는 SQL Editor에서 실행:

```sql
ALTER TABLE creators ADD COLUMN IF NOT EXISTS x_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS notion_id TEXT UNIQUE;
```

**Step 2: TypeScript 타입 업데이트**

`lib/supabase.ts`의 `Creator` 타입에 `notion_id` 필드 추가:

기존:
```typescript
export type Creator = {
  id: string;
  name: string;
  profile_image_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  x_url?: string | null;
  twitter_url?: string | null;
  created_at: string;
};
```

변경:
```typescript
export type Creator = {
  id: string;
  name: string;
  profile_image_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  x_url?: string | null;
  twitter_url?: string | null;
  notion_id?: string | null;
  created_at: string;
};
```

**Step 3: supabase-schema.sql 업데이트** (문서 기록용)

```sql
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  x_url TEXT,
  notion_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 4: Commit**

```bash
git commit -m "chore: add x_url and notion_id columns to creators schema"
```

---

## Task 2: 환경변수 추가 + 크리에이터 Sync API 생성

**Files:**
- Modify: `.env.local` — `NOTION_CREATOR_LIST_DB_ID` 추가
- Create: `app/api/sync/creators/route.ts`

**Step 1: .env.local에 크리에이터 리스트 DB ID 추가**

```
NOTION_CREATOR_LIST_DB_ID="2f601ca3-e480-80c0-82a3-000b7f67640d"
```

주의: 기존 `NOTION_CREATOR_DB_ID`는 크리에이터 **신청** DB용. 이건 크리에이터 **리스트** DB용으로 별도.

**Step 2: sync API 생성**

`app/api/sync/creators/route.ts` 생성 — 블로그 sync를 참조하되 훨씬 단순 (본문 HTML 변환 불필요, 속성만 추출):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { notion } from "@/lib/notion/client";
import { resolveImageUrl } from "@/lib/notion/image-upload";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// ─── Auth (블로그 sync와 동일) ────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function authenticate(request: NextRequest, body: unknown): Promise<boolean> {
  const secret = process.env.SYNC_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (scheme === "Bearer" && token && safeEqual(token, secret)) return true;
    }
  }
  if (secret && body && typeof body === "object" && "secret" in body &&
      typeof (body as { secret: string }).secret === "string" &&
      safeEqual((body as { secret: string }).secret, secret)) {
    return true;
  }
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (host) {
    const allowedOrigin = `https://${host}`;
    if (origin === allowedOrigin || referer?.startsWith(allowedOrigin)) return true;
    if (origin?.startsWith("http://localhost") || referer?.startsWith("http://localhost")) return true;
  }
  return false;
}

// ─── Notion Property Extractors ──────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */

function getTitle(properties: any, key: string): string {
  const prop = properties[key];
  if (!prop || prop.type !== "title") return "";
  return (prop.title ?? []).map((rt: any) => rt.plain_text ?? "").join("");
}

function getUrl(properties: any, key: string): string | null {
  const prop = properties[key];
  if (!prop || prop.type !== "url") return null;
  return prop.url ?? null;
}

function getCheckbox(properties: any, key: string): boolean {
  const prop = properties[key];
  if (!prop || prop.type !== "checkbox") return false;
  return prop.checkbox ?? false;
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

// ─── Fetch All Pages ─────────────────────────────────────────

async function fetchAllCreatorPages(): Promise<any[]> {
  const allPages: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_CREATOR_LIST_DB_ID!,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    allPages.push(...(response.results ?? []));
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return allPages;
}

// ─── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body OK */ }

  if (!(await authenticate(request, body))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NOTION_CREATOR_LIST_DB_ID) {
    return NextResponse.json({ error: "NOTION_CREATOR_LIST_DB_ID is not configured" }, { status: 500 });
  }

  const result = { synced: 0, removed: 0, errors: [] as string[] };

  try {
    console.log("[sync/creators] Starting creator sync...");
    const supabase = createAdminClient();

    // 1. Fetch all pages from Notion
    const allPages = await fetchAllCreatorPages();
    console.log(`[sync/creators] Found ${allPages.length} pages in Notion DB`);

    // 2. Filter: 홈페이지공개 = true
    const publicPages = allPages.filter((page) => getCheckbox(page.properties, "홈페이지공개"));
    console.log(`[sync/creators] ${publicPages.length} creators marked as public`);

    // 3. Collect public notion IDs for cleanup later
    const publicNotionIds = new Set<string>();

    // 4. Process each public creator
    for (const page of publicPages) {
      const name = getTitle(page.properties, "이름") || "Unknown";
      const notionId = page.id;
      publicNotionIds.add(notionId);

      try {
        // Profile image
        const imageFile = getFileOrUrl(page.properties, "프로필이미지");
        const profileImageUrl = imageFile ? await resolveImageUrl(supabase, imageFile) : null;

        const creatorData = {
          notion_id: notionId,
          name,
          profile_image_url: profileImageUrl,
          instagram_url: getUrl(page.properties, "인스타"),
          youtube_url: getUrl(page.properties, "유튜브"),
          tiktok_url: getUrl(page.properties, "틱톡"),
          x_url: getUrl(page.properties, "X"),
        };

        const { error } = await supabase.from("creators").upsert(creatorData, { onConflict: "notion_id" });
        if (error) {
          result.errors.push(`"${name}": ${error.message}`);
          continue;
        }
        result.synced++;
        console.log(`[sync/creators] Synced: "${name}"`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push(`"${name}": ${message}`);
      }
    }

    // 5. Remove creators no longer public in Notion
    if (publicNotionIds.size > 0) {
      const { data: existing } = await supabase.from("creators").select("id, notion_id").not("notion_id", "is", null);
      if (existing) {
        const toRemove = existing.filter((c) => c.notion_id && !publicNotionIds.has(c.notion_id));
        for (const creator of toRemove) {
          await supabase.from("creators").delete().eq("id", creator.id);
          result.removed++;
        }
      }
    }

    console.log(`[sync/creators] Done. Synced: ${result.synced}, Removed: ${result.removed}, Errors: ${result.errors.length}`);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync/creators] Fatal error:", message);
    return NextResponse.json({ synced: result.synced, removed: result.removed, errors: [...result.errors, `Fatal: ${message}`] }, { status: 500 });
  }
}
```

**Step 3: image-upload.ts의 IMAGE_PREFIX를 파라미터화**

현재 `IMAGE_PREFIX = "blog-images"`로 하드코딩되어 있음. 크리에이터 이미지는 `creator-images/` 경로에 저장하고 싶으므로, `resolveImageUrl`과 `uploadToSupabase`에 prefix 파라미터를 추가하거나 — 가장 간단하게는 현재 그대로 `blog-images/`에 저장해도 해시 기반 중복 방지가 되므로 문제없음. **변경 불필요**.

**Step 4: 빌드 확인**

Run: `npm run build 2>&1 | tail -20`

**Step 5: Commit**

```bash
git commit -m "feat: add creator Notion sync API (/api/sync/creators)"
```

---

## Task 3: 어드민 단일 페이지 통합

**Files:**
- Delete: `app/admin/blog/page.tsx`
- Delete: `components/admin/blog-list-page.tsx`
- Modify: `app/admin/layout-client.tsx` — 탭 네비게이션 제거
- Modify: `components/admin/dashboard-page.tsx` — 동기화 버튼 2개 통합

**Step 1: 블로그 페이지 삭제**

```bash
rm app/admin/blog/page.tsx
rmdir app/admin/blog/
rm components/admin/blog-list-page.tsx
```

**Step 2: layout-client.tsx에서 탭 네비게이션 제거**

탭이 필요 없으므로 navItems와 nav 요소를 제거. 로고 + 우측 액션만 남김:

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LogOut, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="text-sm font-semibold tracking-tight text-neutral-50">
            KOREANERS
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300">
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">사이트</span>
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300">
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
```

**Step 3: dashboard-page.tsx 리라이트 — 통계 + 동기화 버튼 2개**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FileText, Globe, FilePen, RefreshCw, Users } from 'lucide-react'

export function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 })
  const [loading, setLoading] = useState(true)
  const [blogSyncing, setBlogSyncing] = useState(false)
  const [creatorSyncing, setCreatorSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ type: 'blog' | 'creator'; message: string; success: boolean } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, publishedRes] = await Promise.all([
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('published', true),
        ])
        setStats({
          total: allRes.count || 0,
          published: publishedRes.count || 0,
          draft: (allRes.count || 0) - (publishedRes.count || 0),
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSync = async (type: 'blog' | 'creator') => {
    const setSyncing = type === 'blog' ? setBlogSyncing : setCreatorSyncing
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch(`/api/sync/${type === 'blog' ? 'blog' : 'creators'}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const label = type === 'blog' ? '블로그' : '크리에이터'
        const parts = [`${data.synced}건 동기화`]
        if (data.removed) parts.push(`${data.removed}건 제거`)
        if (data.errors?.length) parts.push(`${data.errors.length}건 오류`)
        setSyncResult({ type, message: `${label}: ${parts.join(', ')}`, success: !data.errors?.length })
      } else {
        setSyncResult({ type, message: data.error || '동기화 실패', success: false })
      }
    } catch {
      setSyncResult({ type, message: '네트워크 오류', success: false })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-md bg-neutral-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-lg bg-neutral-800" />
      </div>
    )
  }

  const statCards = [
    { label: '전체 포스트', value: stats.total, icon: FileText, color: 'text-neutral-50' },
    { label: '발행됨', value: stats.published, icon: Globe, color: 'text-green-400' },
    { label: '임시저장', value: stats.draft, icon: FilePen, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-neutral-50">대시보드</h1>
        <p className="mt-1 text-sm text-neutral-400">사이트 현황 요약</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-neutral-50">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Sync Buttons */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-neutral-50">Notion 동기화</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSync('blog')}
            disabled={blogSyncing}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${blogSyncing ? 'animate-spin' : ''}`} />
            {blogSyncing ? '동기화 중...' : '블로그 동기화'}
          </button>
          <button
            onClick={() => handleSync('creator')}
            disabled={creatorSyncing}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
          >
            <Users className={`h-4 w-4 ${creatorSyncing ? 'animate-spin' : ''}`} />
            {creatorSyncing ? '동기화 중...' : '크리에이터 동기화'}
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className={`mt-3 rounded-lg border px-4 py-2.5 text-sm ${
            syncResult.success
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}>
            {syncResult.message}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 4: 빌드 확인**

Run: `npm run build 2>&1 | tail -20`

**Step 5: Commit**

```bash
git commit -m "refactor: consolidate admin to single dashboard with sync buttons"
```

---

## Task 4: Notion DB에 필드 추가 (수동)

**수동 작업** — 코드 아님:

1. Notion 크리에이터 리스트 DB (`2f601ca3e480806794b5ec5b85167f35`) 열기
2. `프로필이미지` 속성 추가 — 타입: Files & Media
3. `홈페이지공개` 속성 추가 — 타입: Checkbox
4. 공개할 크리에이터에 체크박스 체크 + 프로필 이미지 업로드
5. 어드민에서 "크리에이터 동기화" 버튼 클릭하여 테스트

---

## Task 5: 최종 빌드 + 정리

**Step 1: 빌드 확인**

```bash
rm -rf .next && npm run build
```

**Step 2: Commit if needed**

```bash
git commit -m "chore: final cleanup for creator sync"
```

---

## Execution Summary

| Task | 설명 | 타입 |
|------|------|------|
| 1 | Supabase 스키마 업데이트 (x_url, notion_id) | DB + 타입 |
| 2 | 크리에이터 Sync API 생성 | 핵심 기능 |
| 3 | 어드민 단일 대시보드 통합 | UI 리팩토링 |
| 4 | Notion DB 필드 추가 (수동) | 수동 작업 |
| 5 | 최종 빌드 + 정리 | 마감 |

**Total: 5 tasks, ~3 commits**
