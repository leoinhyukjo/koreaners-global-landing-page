# Admin Page Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 어드민 6개 섹션을 2개(대시보드+블로그)로 축소하고, 사이드바를 상단 탭 바로 전환하며, 미니멀 다크(Vercel/Linear 스타일) 디자인으로 통일

**Architecture:** 점진적 정리 — 불필요 파일 삭제 → 레이아웃 전환 → 남은 페이지 UI 리프레시. 인증/Supabase 인프라는 그대로 유지.

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui, Supabase, Lucide Icons

---

## Phase 1: 불필요 파일 삭제

### Task 1: 블로그 에디터 관련 파일 삭제

**Files:**
- Delete: `app/admin/blog/edit/page.tsx`
- Delete: `components/admin/blog-editor.tsx`
- Delete: `components/admin/blog-editor-wrapper.tsx`
- Delete: `components/admin/blog-dialog.tsx`

**Step 1: 삭제 대상 파일에 대한 참조 확인**

Run: `grep -r "blog-editor\|blog-dialog\|BlogEditor\|BlogDialog\|blog/edit" app/ components/ --include="*.tsx" --include="*.ts" -l`

참조하는 파일이 있으면 import 제거 필요. `blog/edit/page.tsx`는 라우트이므로 다른 파일에서 직접 import하지 않지만, 링크(`/admin/blog/edit`)가 있을 수 있음.

**Step 2: 블로그 목록에서 편집 링크 제거**

`components/admin/blog-list-page.tsx`에서 `/admin/blog/edit` 으로 향하는 링크/버튼이 있으면 제거.

**Step 3: 파일 삭제**

```bash
rm app/admin/blog/edit/page.tsx
rm components/admin/blog-editor.tsx
rm components/admin/blog-editor-wrapper.tsx
rm components/admin/blog-dialog.tsx
```

**Step 4: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npm run build 2>&1 | head -50`
Expected: 에러 없음

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: remove blog editor files (Notion is single source)"
```

---

### Task 2: 포트폴리오 관련 파일 삭제

**Files:**
- Delete: `app/admin/portfolios/` (entire directory)
- Delete: `components/admin/portfolios-list-page.tsx`
- Delete: `components/admin/portfolio-edit-form.tsx`
- Delete: `components/admin/portfolio-editor-wrapper.tsx`
- Delete: `components/admin/portfolio-dialog.tsx`

**Step 1: 참조 확인**

Run: `grep -r "portfolios-list-page\|portfolio-edit-form\|portfolio-editor-wrapper\|portfolio-dialog\|PortfoliosListPage\|PortfolioEditForm\|PortfolioDialog" app/ components/ --include="*.tsx" --include="*.ts" -l`

대시보드에서 포트폴리오 관련 import/데이터가 있으면 Task 6에서 처리.

**Step 2: 파일 삭제**

```bash
rm -rf app/admin/portfolios/
rm components/admin/portfolios-list-page.tsx
rm components/admin/portfolio-edit-form.tsx
rm components/admin/portfolio-editor-wrapper.tsx
rm components/admin/portfolio-dialog.tsx
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove portfolio admin pages (future Notion sync)"
```

---

### Task 3: 크리에이터 관련 파일 삭제

**Files:**
- Delete: `app/admin/creators/page.tsx`
- Delete: `components/admin/creators-list-page.tsx`
- Delete: `components/admin/creator-dialog.tsx`

**Step 1: 참조 확인**

Run: `grep -r "creators-list-page\|creator-dialog\|CreatorsListPage\|CreatorDialog" app/ components/ --include="*.tsx" --include="*.ts" -l`

**Step 2: 파일 삭제**

```bash
rm app/admin/creators/page.tsx
rmdir app/admin/creators/ 2>/dev/null
rm components/admin/creators-list-page.tsx
rm components/admin/creator-dialog.tsx
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove creator admin pages (future Notion sync)"
```

---

### Task 4: 문의 내역 파일 삭제

**Files:**
- Delete: `app/admin/inquiries/` (entire directory)
- Delete: `components/admin/realtime-notification.tsx`

**Step 1: 참조 확인**

`realtime-notification.tsx`는 `layout-client.tsx`에서 import됨 — Task 6에서 레이아웃 전환 시 함께 제거.

**Step 2: 파일 삭제**

```bash
rm -rf app/admin/inquiries/
```

realtime-notification은 레이아웃에서 아직 참조하므로 Task 6에서 삭제.

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove inquiries admin page (managed in Notion)"
```

---

### Task 5: 합류 신청 파일 삭제

**Files:**
- Delete: `app/admin/creator-applications/` (entire directory)

**Step 1: 파일 삭제**

```bash
rm -rf app/admin/creator-applications/
```

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: remove creator applications admin page (managed in Notion)"
```

---

## Phase 2: 레이아웃 전환 (사이드바 → 상단 탭 바)

### Task 6: layout-client.tsx를 탭 바 레이아웃으로 전환

**Files:**
- Modify: `app/admin/layout-client.tsx`
- Delete: `components/admin/realtime-notification.tsx`

**Step 1: layout-client.tsx 전체 리라이트**

기존 사이드바(264px) + 모바일 Sheet 메뉴를 제거하고, 상단 고정 탭 바로 교체.

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FileText, LogOut, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const navItems = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '블로그', href: '/admin/blog', icon: FileText },
]

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-tight text-neutral-50">
              KOREANERS
            </span>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-neutral-800 text-neutral-50'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">사이트</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
```

**Step 2: realtime-notification.tsx 삭제**

```bash
rm components/admin/realtime-notification.tsx
```

**Step 3: 빌드 확인**

Run: `npm run build 2>&1 | head -50`
Expected: 에러 없음

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: replace sidebar with minimal top tab bar"
```

---

## Phase 3: 대시보드 간소화

### Task 7: 대시보드를 블로그 전용 통계로 축소

**Files:**
- Modify: `components/admin/dashboard-page.tsx`

**Step 1: dashboard-page.tsx 전체 리라이트**

포트폴리오/크리에이터/문의/합류신청 통계 모두 제거. 블로그 관련만 남김.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Globe, FilePen } from 'lucide-react'
import Link from 'next/link'

interface BlogStats {
  total: number
  published: number
  draft: number
}

interface RecentPost {
  id: string
  title: string
  slug: string
  category: string
  published: boolean
  created_at: string
}

export function DashboardPage() {
  const [stats, setStats] = useState<BlogStats>({ total: 0, published: 0, draft: 0 })
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      try {
        const [allRes, publishedRes, recentRes] = await Promise.all([
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
          supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('published', true),
          supabase.from('blog_posts').select('id, title, slug, category, published, created_at').order('created_at', { ascending: false }).limit(5),
        ])

        setStats({
          total: allRes.count || 0,
          published: publishedRes.count || 0,
          draft: (allRes.count || 0) - (publishedRes.count || 0),
        })
        setRecentPosts(recentRes.data || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-md bg-neutral-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-800" />
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
        <p className="mt-1 text-sm text-neutral-400">블로그 현황 요약</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-neutral-50">{card.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Posts */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-50">최근 포스트</h2>
          <Link
            href="/admin/blog"
            className="text-xs text-neutral-400 transition-colors hover:text-neutral-50"
          >
            모두 보기 →
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 divide-y divide-neutral-800">
          {recentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <FileText className="mb-2 h-8 w-8" />
              <p className="text-sm">아직 포스트가 없습니다</p>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-50">{post.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {post.category} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    post.published
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-yellow-400/10 text-yellow-400'
                  }`}
                >
                  {post.published ? '발행' : '임시저장'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: 빌드 확인**

Run: `npm run build 2>&1 | head -50`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: simplify dashboard to blog-only stats"
```

---

## Phase 4: 블로그 목록 UI 리프레시

### Task 8: 블로그 목록 페이지를 미니멀 다크로 리프레시

**Files:**
- Modify: `components/admin/blog-list-page.tsx`

**Step 1: blog-list-page.tsx 리라이트**

기존 코드의 데이터 페칭/동기화 로직은 유지하되, UI를 미니멀 다크 토큰으로 전면 교체.

핵심 변경사항:
- zinc → neutral 색상 계열로 통일
- 페이지 헤더: 제목 + 설명 + 우측 동기화 버튼 (통일 패턴)
- 테이블: neutral-800 보더, hover:bg-neutral-800/50
- 배지: 커스텀 pill 스타일 (rounded-full + 색상별 bg/text)
- 모바일: 카드 레이아웃 유지하되 같은 디자인 토큰 적용
- 동기화 결과: 토스트 대신 배너 형태로 표시
- 빈 상태: 아이콘 + 메시지 센터 정렬

디자인 토큰 참조:
- 배경: bg-neutral-950 (페이지), bg-neutral-900 (카드/테이블)
- 보더: border-neutral-800
- 텍스트: text-neutral-50 (주), text-neutral-400 (보조), text-neutral-500 (메타)
- 호버: hover:bg-neutral-800/50
- 라운딩: rounded-lg 통일

**Step 2: 빌드 확인**

Run: `npm run build 2>&1 | head -50`
Expected: 에러 없음

**Step 3: 브라우저 확인**

Run: `npm run dev`
`/admin` 접속하여 대시보드 + 블로그 탭 전환, 모바일 반응형 확인.

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: refresh blog list UI with minimal dark design"
```

---

## Phase 5: 마감 정리

### Task 9: 미사용 import/의존성 정리 및 최종 빌드 확인

**Files:**
- Check: `app/admin/layout.tsx` (서버 레이아웃 - 변경 불필요할 가능성 높음)
- Check: `app/globals.css` (.admin-content 스타일 정리 필요 시)
- Check: `package.json` (BlockNote 등 미사용 의존성 확인)

**Step 1: 빌드 확인**

Run: `npm run build`
Expected: 에러/경고 없음

**Step 2: 미사용 import 정리**

빌드 경고에서 미사용 import 발견 시 제거.

**Step 3: globals.css에서 불필요한 어드민 스타일 제거**

`.admin-content` 관련 스타일 중 삭제된 컴포넌트에만 해당하는 것이 있으면 제거.

**Step 4: 최종 Commit**

```bash
git add -A && git commit -m "chore: clean up unused imports and styles"
```

---

## Execution Summary

| Phase | Tasks | 설명 |
|-------|-------|------|
| 1 | Task 1-5 | 불필요 파일 삭제 (에디터, 포트폴리오, 크리에이터, 문의, 합류) |
| 2 | Task 6 | 사이드바 → 상단 탭 바 전환 |
| 3 | Task 7 | 대시보드 간소화 (블로그 통계만) |
| 4 | Task 8 | 블로그 목록 UI 미니멀 다크 리프레시 |
| 5 | Task 9 | 정리 및 최종 빌드 확인 |

**Total: 9 tasks, ~5 commits**
