# Notion → Portfolio 자동 포스팅 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Notion DB의 포트폴리오 포스트를 웹사이트 `/portfolio`에 자동 렌더링. Supabase 기반 포트폴리오를 완전 대체.

**Architecture:** Notion API 직접 호출 + ISR(60초) 캐싱. 목록 페이지는 Server Component가 데이터를 fetch하고 Client Component가 카테고리 필터링 담당. 상세 페이지는 Server Component로 Notion 블록을 커스텀 렌더러로 변환.

**Tech Stack:** Next.js 16 (App Router), @notionhq/client (기존 설치됨), Tailwind CSS 4, ISR

---

## Task 1: Notion DB 속성 추가 + 환경변수 설정

**Files:**
- Modify: `.env.local` (add NOTION_PORTFOLIO_DB_ID)
- Modify: `.env.example` (add NOTION_PORTFOLIO_DB_ID)

**Step 1: Notion DB에 속성 추가**

Notion MCP `update_data_source`로 📓 포트폴리오 포스트 DB에 속성 추가:
- 썸네일 (Files & media)
- 게시 (Checkbox)
- 요약 (Rich text)
- 카테고리 (Select: Beauty, F&B, Fashion, Lifestyle, etc)
- 클라이언트명 (Rich text)

> Note: Notion MCP로 스키마 변경이 안 되면 수동으로 Notion UI에서 추가

**Step 2: 기존 2개 포스트에 속성값 채우기**

감자밭, 뉴믹스 페이지에:
- 게시 = ✅
- 카테고리 = F&B
- 클라이언트명 = 감자밭 / 뉴믹스
- 요약 = 기존 Supabase 데이터 참고
- 썸네일 = 기존 Supabase Storage URL 입력 (외부 링크로)

**Step 3: 환경변수 추가**

```bash
# .env.local
NOTION_PORTFOLIO_DB_ID=2f501ca3e48080ce8bf9c3b7606a692d
```

```bash
# .env.example에 추가
NOTION_PORTFOLIO_DB_ID=your-notion-portfolio-database-id
```

**Step 4: Vercel 환경변수 등록**

```bash
vercel env add NOTION_PORTFOLIO_DB_ID
# 값: 2f501ca3e48080ce8bf9c3b7606a692d
```

---

## Task 2: Notion Portfolio API 함수 생성

**Files:**
- Create: `lib/notion-portfolio.ts`

**Step 1: API 함수 작성**

```typescript
// lib/notion-portfolio.ts
import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  BlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATABASE_ID = process.env.NOTION_PORTFOLIO_DB_ID!

// 포트폴리오 목록용 타입
export type NotionPortfolio = {
  id: string
  title: string
  clientName: string
  thumbnailUrl: string | null
  category: string | null
  summary: string
  createdAt: string
}

// 페이지 속성에서 데이터 추출 헬퍼
function extractTitle(page: PageObjectResponse): string {
  const prop = page.properties['이름']
  if (prop?.type === 'title') {
    return prop.title.map((t) => t.plain_text).join('')
  }
  return ''
}

function extractRichText(page: PageObjectResponse, name: string): string {
  const prop = page.properties[name]
  if (prop?.type === 'rich_text') {
    return prop.rich_text.map((t) => t.plain_text).join('')
  }
  return ''
}

function extractCheckbox(page: PageObjectResponse, name: string): boolean {
  const prop = page.properties[name]
  if (prop?.type === 'checkbox') {
    return prop.checkbox
  }
  return false
}

function extractSelect(page: PageObjectResponse, name: string): string | null {
  const prop = page.properties[name]
  if (prop?.type === 'select' && prop.select) {
    return prop.select.name
  }
  return null
}

function extractFileUrl(page: PageObjectResponse, name: string): string | null {
  const prop = page.properties[name]
  if (prop?.type === 'files' && prop.files.length > 0) {
    const file = prop.files[0]
    if (file.type === 'external') return file.external.url
    if (file.type === 'file') return file.file.url
  }
  return null
}

function pageToPortfolio(page: PageObjectResponse): NotionPortfolio {
  return {
    id: page.id,
    title: extractTitle(page),
    clientName: extractRichText(page, '클라이언트명'),
    thumbnailUrl: extractFileUrl(page, '썸네일'),
    category: extractSelect(page, '카테고리'),
    summary: extractRichText(page, '요약'),
    createdAt: page.created_time,
  }
}

// 게시된 포트폴리오 목록 가져오기
export async function getPublishedPortfolios(): Promise<NotionPortfolio[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: '게시',
      checkbox: { equals: true },
    },
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  })

  return response.results
    .filter((page): page is PageObjectResponse => 'properties' in page)
    .map(pageToPortfolio)
}

// 단일 포트폴리오 페이지 가져오기
export async function getPortfolioPage(
  pageId: string
): Promise<NotionPortfolio | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId })
    if (!('properties' in page)) return null

    const isPublished = extractCheckbox(page as PageObjectResponse, '게시')
    if (!isPublished) return null

    return pageToPortfolio(page as PageObjectResponse)
  } catch {
    return null
  }
}

// 페이지의 블록(본문 콘텐츠) 가져오기
export async function getPortfolioBlocks(
  pageId: string
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = []
  let cursor: string | undefined

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    })

    blocks.push(
      ...response.results.filter(
        (b): b is BlockObjectResponse => 'type' in b
      )
    )
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  // 중첩 블록(children) 재귀적으로 가져오기
  for (const block of blocks) {
    if (block.has_children) {
      const children = await getPortfolioBlocks(block.id)
      ;(block as any).children = children
    }
  }

  return blocks
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page && npx tsc --noEmit lib/notion-portfolio.ts`

---

## Task 3: Notion 블록 렌더러 생성

**Files:**
- Create: `lib/notion-renderer.tsx`

**Step 1: 렌더러 작성**

Notion 블록을 React 컴포넌트로 변환하는 Server Component 렌더러.
지원 블록: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, image, divider, callout, quote, table, bookmark
지원 인라인: bold, italic, strikethrough, underline, code, link, color

```typescript
// lib/notion-renderer.tsx
import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints'

// Rich text 렌더링
function renderRichText(richTexts: RichTextItemResponse[]): React.ReactNode[] {
  return richTexts.map((text, i) => {
    let content: React.ReactNode = text.plain_text

    if (text.annotations.bold) content = <strong key={i}>{content}</strong>
    if (text.annotations.italic) content = <em key={i}>{content}</em>
    if (text.annotations.strikethrough) content = <s key={i}>{content}</s>
    if (text.annotations.underline) content = <u key={i}>{content}</u>
    if (text.annotations.code) content = <code key={i} className="bg-zinc-700 px-1.5 py-0.5 rounded text-sm">{content}</code>

    if (text.href) {
      content = <a key={i} href={text.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{content}</a>
    }

    // 중첩된 formatting이 있을 때 key 충돌 방지
    return <span key={i}>{content}</span>
  })
}

// 개별 블록 렌더링
function renderBlock(block: BlockObjectResponse & { children?: BlockObjectResponse[] }): React.ReactNode {
  const { type, id } = block

  switch (type) {
    case 'paragraph':
      return (
        <p key={id} className="mb-4 leading-relaxed">
          {renderRichText(block.paragraph.rich_text)}
        </p>
      )

    case 'heading_1':
      return (
        <h1 key={id} className="text-3xl font-bold mt-10 mb-4 text-white">
          {renderRichText(block.heading_1.rich_text)}
        </h1>
      )

    case 'heading_2':
      return (
        <h2 key={id} className="text-2xl font-bold mt-8 mb-3 text-white">
          {renderRichText(block.heading_2.rich_text)}
        </h2>
      )

    case 'heading_3':
      return (
        <h3 key={id} className="text-xl font-bold mt-6 mb-2 text-white">
          {renderRichText(block.heading_3.rich_text)}
        </h3>
      )

    case 'bulleted_list_item':
      return (
        <li key={id} className="ml-4 mb-1 list-disc">
          {renderRichText(block.bulleted_list_item.rich_text)}
          {block.children && block.children.length > 0 && (
            <ul className="mt-1">{block.children.map(renderBlock)}</ul>
          )}
        </li>
      )

    case 'numbered_list_item':
      return (
        <li key={id} className="ml-4 mb-1 list-decimal">
          {renderRichText(block.numbered_list_item.rich_text)}
          {block.children && block.children.length > 0 && (
            <ol className="mt-1">{block.children.map(renderBlock)}</ol>
          )}
        </li>
      )

    case 'image': {
      const src = block.image.type === 'external'
        ? block.image.external.url
        : block.image.file.url
      const caption = block.image.caption?.map(c => c.plain_text).join('') || ''
      return (
        <figure key={id} className="my-6">
          <img src={src} alt={caption} className="w-full rounded-none" loading="lazy" />
          {caption && <figcaption className="text-sm text-zinc-400 mt-2 text-center">{caption}</figcaption>}
        </figure>
      )
    }

    case 'divider':
      return <hr key={id} className="border-zinc-700 my-8" />

    case 'callout':
      return (
        <div key={id} className="flex gap-3 p-4 my-4 bg-zinc-700/30 border border-zinc-600/50 rounded-none">
          {block.callout.icon?.type === 'emoji' && (
            <span className="text-xl flex-shrink-0">{block.callout.icon.emoji}</span>
          )}
          <div className="flex-1">
            {renderRichText(block.callout.rich_text)}
            {block.children && block.children.map(renderBlock)}
          </div>
        </div>
      )

    case 'quote':
      return (
        <blockquote key={id} className="border-l-4 border-zinc-500 pl-4 my-4 italic text-zinc-300">
          {renderRichText(block.quote.rich_text)}
        </blockquote>
      )

    case 'table': {
      const rows = block.children || []
      return (
        <div key={id} className="overflow-x-auto my-6">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="border-b border-zinc-700">
                  {row.table_row?.cells?.map((cell: RichTextItemResponse[], ci: number) => (
                    <td key={ci} className="px-4 py-2 text-sm">
                      {renderRichText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'bookmark':
      return (
        <a key={id} href={block.bookmark.url} target="_blank" rel="noopener noreferrer"
           className="block p-4 my-4 border border-zinc-700 hover:border-zinc-500 transition-colors rounded-none">
          <span className="text-blue-400 text-sm break-all">{block.bookmark.url}</span>
        </a>
      )

    default:
      // 지원하지 않는 블록은 무시
      return null
  }
}

// 연속된 list item을 ul/ol로 감싸는 후처리
function groupListItems(blocks: (BlockObjectResponse & { children?: BlockObjectResponse[] })[]): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []
  let currentListType: 'bulleted' | 'numbered' | null = null

  const flushList = () => {
    if (currentList.length > 0 && currentListType) {
      const Tag = currentListType === 'bulleted' ? 'ul' : 'ol'
      result.push(<Tag key={`list-${result.length}`} className="mb-4">{currentList}</Tag>)
      currentList = []
      currentListType = null
    }
  }

  for (const block of blocks) {
    if (block.type === 'bulleted_list_item') {
      if (currentListType !== 'bulleted') flushList()
      currentListType = 'bulleted'
      currentList.push(renderBlock(block))
    } else if (block.type === 'numbered_list_item') {
      if (currentListType !== 'numbered') flushList()
      currentListType = 'numbered'
      currentList.push(renderBlock(block))
    } else {
      flushList()
      result.push(renderBlock(block))
    }
  }
  flushList()

  return result
}

// 메인 렌더러 컴포넌트
export function NotionRenderer({ blocks }: { blocks: (BlockObjectResponse & { children?: BlockObjectResponse[] })[] }) {
  return (
    <div className="notion-content text-zinc-200 leading-relaxed text-base lg:text-lg">
      {groupListItems(blocks)}
    </div>
  )
}
```

---

## Task 4: 포트폴리오 목록 페이지 재작성

**Files:**
- Modify: `app/portfolio/page.tsx` (전면 재작성)

**Step 1: Server Component + Client Component 하이브리드로 재작성**

```typescript
// app/portfolio/page.tsx
import { getPublishedPortfolios, type NotionPortfolio } from '@/lib/notion-portfolio'
import Navigation from '@/components/navigation'
import { PortfolioGrid } from './portfolio-grid'

export const revalidate = 60 // ISR: 60초마다 재생성

export const metadata = {
  title: 'Portfolio | KOREANERS',
  description: 'KOREANERS의 포트폴리오를 확인하세요.',
}

export default async function PortfolioPage() {
  const portfolios = await getPublishedPortfolios()

  return (
    <main className="min-h-screen bg-zinc-900 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <PortfolioGrid portfolios={portfolios} />
    </main>
  )
}
```

**Step 2: Client Component 분리 (카테고리 필터)**

Create: `app/portfolio/portfolio-grid.tsx`

기존 portfolio/page.tsx의 UI 로직을 Client Component로 분리.
- 카테고리 탭 필터링
- 카드 그리드 렌더링
- i18n (useLocale)
- 기존 스타일 그대로 유지

데이터 타입만 `Portfolio` (Supabase) → `NotionPortfolio` (Notion)으로 변경.
필드 매핑:
- `thumbnail_url` → `thumbnailUrl`
- `client_name` → `clientName`
- `category: string[]` → `category: string | null`
- `id` (Supabase UUID) → `id` (Notion page ID, 하이픈 포함)

---

## Task 5: 포트폴리오 상세 페이지 재작성

**Files:**
- Modify: `app/portfolio/[id]/page.tsx` (전면 재작성)

**Step 1: Server Component로 재작성**

```typescript
// app/portfolio/[id]/page.tsx
import { getPortfolioPage, getPortfolioBlocks, getPublishedPortfolios } from '@/lib/notion-portfolio'
import { NotionRenderer } from '@/lib/notion-renderer'
import Navigation from '@/components/navigation'
import { MarketingCTA } from '@/components/common/marketing-cta'
import { PortfolioDetailClient } from './portfolio-detail-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 60

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const portfolio = await getPortfolioPage(id)
  if (!portfolio) return { title: 'Portfolio Not Found' }

  return {
    title: `${portfolio.title} | KOREANERS`,
    description: portfolio.summary || portfolio.title,
    openGraph: {
      title: portfolio.title,
      description: portfolio.summary || portfolio.title,
      images: portfolio.thumbnailUrl ? [portfolio.thumbnailUrl] : [],
    },
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { id } = await params
  const [portfolio, blocks, allPortfolios] = await Promise.all([
    getPortfolioPage(id),
    getPortfolioBlocks(id),
    getPublishedPortfolios(),
  ])

  if (!portfolio) notFound()

  const otherPortfolios = allPortfolios.filter((p) => p.id !== id).slice(0, 3)

  return (
    <main className="min-h-screen relative overflow-hidden bg-zinc-900">
      <Navigation />
      <article className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <PortfolioDetailClient portfolio={portfolio} />

          {/* 구분선 */}
          <div className="border-t border-zinc-700/50 mt-8 sm:mt-10 mb-8 sm:mb-10" />

          {/* 본문 */}
          <div className="border border-zinc-700/50 bg-zinc-800 px-6 md:px-12 lg:px-24 py-6 md:py-8 lg:py-10 rounded-none">
            <NotionRenderer blocks={blocks} />
          </div>

          <MarketingCTA />

          {/* 다른 포트폴리오 */}
          {otherPortfolios.length > 0 && (
            <PortfolioOtherSection portfolios={otherPortfolios} />
          )}
        </div>
      </article>
    </main>
  )
}
```

**Step 2: 클라이언트 컴포넌트 분리**

Create: `app/portfolio/[id]/portfolio-detail-client.tsx`

헤더 영역(뒤로가기 버튼, 썸네일, 제목, 날짜)과 "다른 포트폴리오" 섹션을
Client Component로 분리. `useLocale()` 사용을 위해.

Create: `app/portfolio/[id]/portfolio-other-section.tsx`

하단 추천 포트폴리오 섹션. Client Component (useLocale 필요).

---

## Task 6: 설정 업데이트 + 정리

**Files:**
- Modify: `next.config.mjs` (Notion 이미지 도메인 추가)
- Delete: `components/portfolio/portfolio-content-client.tsx`

**Step 1: next.config.mjs에 Notion 이미지 도메인 추가**

```javascript
// remotePatterns 배열에 추가
{
  protocol: 'https',
  hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com', // Notion 호스팅 이미지
},
{
  protocol: 'https',
  hostname: '*.amazonaws.com', // Notion S3 버킷 (다양한 리전)
},
```

**Step 2: BlockNote 포트폴리오 뷰어 삭제**

```bash
rm components/portfolio/portfolio-content-client.tsx
```

**Step 3: .env.example 업데이트**

```bash
# 기존 내용 뒤에 추가
NOTION_PORTFOLIO_DB_ID=your-notion-portfolio-database-id
```

---

## Task 7: 빌드 검증 + 배포

**Step 1: 로컬 빌드 확인**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
npm run build
```

Expected: 빌드 성공, 에러 없음

**Step 2: 로컬 프리뷰 확인**

```bash
npm run dev
# 브라우저에서 확인:
# - /portfolio → 감자밭, 뉴믹스 카드 표시
# - /portfolio/{notion-page-id} → 본문 렌더링
# - 카테고리 필터 작동
# - 썸네일 이미지 표시
```

**Step 3: Vercel 배포**

```bash
git add -A && git commit -m "feat: replace Supabase portfolio with Notion-based auto-posting"
git push
```

Vercel에서 `NOTION_PORTFOLIO_DB_ID` 환경변수 확인 후 배포.

**Step 4: 프로덕션 확인**

```
https://koreaners.co/portfolio → 목록 확인
https://koreaners.co/portfolio/{id} → 상세 확인
```

---

## 의존성 관계

```
Task 1 (DB 속성 + 환경변수)
  ↓
Task 2 (API 함수) → Task 3 (렌더러)
  ↓                    ↓
Task 4 (목록 페이지) ← ┘
  ↓
Task 5 (상세 페이지)
  ↓
Task 6 (설정 + 정리)
  ↓
Task 7 (빌드 + 배포)
```
