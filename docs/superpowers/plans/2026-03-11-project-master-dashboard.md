# Project Master Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notion 전사 Project Board 데이터를 Supabase에 동기화하고, 경영/팀원/보고용 3개 대시보드를 어드민에 구축한다.

**Architecture:** Notion → POST /api/sync/projects → Supabase projects 테이블. 환율은 한국은행 ECOS API로 일 1회 캐싱. 대시보드는 기존 /admin 하위에 recharts + 기존 UI 컴포넌트로 구현.

**Tech Stack:** Next.js 16, Tailwind 4, recharts 2.15.4, Supabase (koreaners_global), 한국은행 ECOS API

**Spec:** `docs/superpowers/specs/2026-03-11-project-master-dashboard-design.md`

---

## File Structure

### New Files
```
lib/sync-auth.ts                           — 동기화 API 공통 인증 함수 (기존 3파일 중복 추출)
lib/notion/extractors.ts                   — Notion 속성 추출 헬퍼 (getTitle, getRichText, getSelect 등)
lib/exchange-rate.ts                       — 한국은행 ECOS API 클라이언트 + 캐시 조회
app/api/sync/projects/route.ts             — 프로젝트 동기화 API
app/admin/dashboard/layout.tsx             — 대시보드 레이아웃 (Server Component)
components/admin/dashboard/dashboard-tabs.tsx — 탭 네비게이션 (Client Component, usePathname)
app/admin/dashboard/page.tsx               — 경영 대시보드
app/admin/dashboard/team/page.tsx          — 팀원 대시보드
app/admin/dashboard/report/page.tsx        — 보고용 대시보드
components/admin/dashboard/kpi-card.tsx    — KPI 카드 컴포넌트
components/admin/dashboard/charts.tsx      — 차트 래퍼 컴포넌트 (recharts)
components/admin/dashboard/project-table.tsx — 프로젝트 테이블 컴포넌트
components/admin/dashboard/brand-accordion.tsx — 브랜드별 접기/펼치기
lib/dashboard/queries.ts                   — Supabase 대시보드 데이터 쿼리 함수
lib/dashboard/calculations.ts             — 미수금/환산 계산 로직
```

### Modified Files
```
components/admin/dashboard-page.tsx        — "프로젝트 동기화" 버튼 추가 + 대시보드 링크
.env.local                                 — NOTION_PROJECT_DB_ID, BOK_ECOS_API_KEY 추가
```

---

## Chunk 1: Data Layer

### Task 1: Supabase 테이블 생성

**Files:**
- Create: Supabase migration (via MCP)

- [ ] **Step 1: projects 테이블 생성**

Supabase MCP `apply_migration` 사용:

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_notion_id text,
  brand_name text,
  status text,
  priority text,
  team text[],
  project_type text[],
  assignee_names text[],
  contract_krw numeric DEFAULT 0,
  contract_jpy numeric DEFAULT 0,
  advance_payment_krw numeric DEFAULT 0,
  advance_payment_jpy numeric DEFAULT 0,
  creator_settlement_krw numeric DEFAULT 0,
  creator_settlement_jpy numeric DEFAULT 0,
  client_settlement text,
  creator_settlement_status text,
  contract_status text,
  estimate_status text,
  tax_invoice_status text,
  start_date date,
  end_date date,
  note text,
  influencer_info text,
  settlement_progress text,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_parent ON projects(parent_notion_id);
CREATE INDEX idx_projects_assignee ON projects USING GIN(assignee_names);
CREATE INDEX idx_projects_team ON projects USING GIN(team);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON projects FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: exchange_rates 테이블 생성**

```sql
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair text NOT NULL,
  rate numeric NOT NULL,
  rate_date date NOT NULL,
  source text DEFAULT 'BOK_ECOS',
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(currency_pair, rate_date)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON exchange_rates FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 3: Supabase에서 테이블 생성 확인**

Supabase MCP `list_tables`로 projects, exchange_rates 테이블 존재 확인.

---

### Task 2: 환율 API 클라이언트

**Files:**
- Create: `lib/exchange-rate.ts`

- [ ] **Step 1: 환율 조회/캐싱 모듈 작성**

```typescript
// lib/exchange-rate.ts
import { createAdminClient } from '@/lib/supabase/admin'

const ECOS_BASE_URL = 'https://ecos.bok.or.kr/api/StatisticSearch'

interface EcosResponse {
  StatisticSearch: {
    row: Array<{
      DATA_VALUE: string
      TIME: string
    }>
  }
}

/**
 * 한국은행 ECOS API에서 JPY→KRW 매매기준율 조회
 * 통계표코드: 731Y001 (일별 환율)
 * 통계항목코드: 0000003 (매매기준율)
 * 아이템코드: JPY (일본 엔)
 */
async function fetchEcosRate(date: string): Promise<number | null> {
  const apiKey = process.env.BOK_ECOS_API_KEY
  if (!apiKey) {
    console.error('[ExchangeRate] BOK_ECOS_API_KEY not set')
    return null
  }

  // ECOS API 형식: /api/StatisticSearch/{apiKey}/json/kr/1/1/731Y001/D/{startDate}/{endDate}/JPY/0000003
  const url = `${ECOS_BASE_URL}/${apiKey}/json/kr/1/1/731Y001/D/${date}/${date}/JPY/0000003`

  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const data: EcosResponse = await res.json()
    const row = data?.StatisticSearch?.row?.[0]
    if (!row?.DATA_VALUE) return null

    // ECOS는 JPY 100엔 기준 → 1엔 기준으로 변환
    return parseFloat(row.DATA_VALUE) / 100
  } catch (error) {
    console.error('[ExchangeRate] ECOS API error:', error)
    return null
  }
}

/**
 * 당일 환율 조회 (캐시 우선, 없으면 ECOS API 호출)
 * 주말/공휴일은 가장 최근 영업일 환율 반환
 */
export async function getJpyToKrwRate(): Promise<number> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // 1. 캐시 확인 (당일)
  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('currency_pair', 'JPY_KRW')
    .eq('rate_date', today)
    .single()

  if (cached) return Number(cached.rate)

  // 2. ECOS API 호출
  const dateCompact = today.replace(/-/g, '')
  const rate = await fetchEcosRate(dateCompact)

  if (rate) {
    await supabase.from('exchange_rates').upsert(
      { currency_pair: 'JPY_KRW', rate, rate_date: today, source: 'BOK_ECOS' },
      { onConflict: 'currency_pair,rate_date' }
    )
    return rate
  }

  // 3. 폴백: 가장 최근 캐시
  const { data: latest } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('currency_pair', 'JPY_KRW')
    .order('rate_date', { ascending: false })
    .limit(1)
    .single()

  if (latest) return Number(latest.rate)

  // 4. 최종 폴백: 하드코딩 (실제 환율 근사값)
  console.warn('[ExchangeRate] No rate available, using fallback 9.0')
  return 9.0
}
```

- [ ] **Step 2: .env.local에 환경변수 추가**

`.env.local`에 다음 추가:
```
BOK_ECOS_API_KEY=your_ecos_api_key_here
NOTION_PROJECT_DB_ID=2f501ca3-e480-8084-9f3a-d97dea794d47
```

- [ ] **Step 3: 커밋**

```bash
git add lib/exchange-rate.ts
git commit -m "feat: add BOK ECOS exchange rate client with caching"
```

---

### Task 3: 동기화 공통 인증 함수 추출

**Files:**
- Create: `lib/sync-auth.ts`

- [ ] **Step 1: 인증 함수 작성**

기존 `app/api/sync/creators/route.ts`의 `authenticate()` 함수를 추출. 동일한 3계층 인증 로직 (Bearer token, body secret, same-origin).

```typescript
// lib/sync-auth.ts
import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

/**
 * 동기화 API 공통 인증
 * 1. Authorization: Bearer <SYNC_SECRET>
 * 2. 요청 바디 { secret: "..." }
 * 3. Same-origin (localhost 허용)
 */
export function authenticateSync(
  request: NextRequest,
  bodySecret?: string
): { authenticated: boolean; error?: string } {
  const syncSecret = process.env.SYNC_SECRET

  // Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ') && syncSecret) {
    const token = authHeader.slice(7)
    try {
      const a = Buffer.from(token)
      const b = Buffer.from(syncSecret)
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return { authenticated: true }
      }
    } catch {
      // fall through
    }
  }

  // Body secret
  if (bodySecret && syncSecret) {
    try {
      const a = Buffer.from(bodySecret)
      const b = Buffer.from(syncSecret)
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return { authenticated: true }
      }
    } catch {
      // fall through
    }
  }

  // Same-origin
  const origin = request.headers.get('origin') || request.headers.get('referer') || ''
  const host = request.headers.get('host') || ''
  if (
    origin.includes(host) ||
    origin.includes('localhost') ||
    host.includes('localhost')
  ) {
    return { authenticated: true }
  }

  return { authenticated: false, error: 'Unauthorized' }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/sync-auth.ts
git commit -m "refactor: extract shared sync auth function"
```

---

### Task 4: Notion 속성 추출 헬퍼

**Files:**
- Create: `lib/notion/extractors.ts`

- [ ] **Step 1: 추출 헬퍼 작성**

기존 sync 파일들에서 반복되는 Notion 속성 추출 함수 통합.

```typescript
// lib/notion/extractors.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export function getTitle(props: any, key: string): string {
  const prop = props[key]
  if (!prop || prop.type !== 'title') return ''
  return prop.title?.map((t: any) => t.plain_text).join('') || ''
}

export function getRichText(props: any, key: string): string {
  const prop = props[key]
  if (!prop || prop.type !== 'rich_text') return ''
  return prop.rich_text?.map((t: any) => t.plain_text).join('') || ''
}

export function getSelect(props: any, key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'select') return null
  return prop.select?.name || null
}

export function getMultiSelect(props: any, key: string): string[] {
  const prop = props[key]
  if (!prop || prop.type !== 'multi_select') return []
  return prop.multi_select?.map((s: any) => s.name) || []
}

export function getNumber(props: any, key: string): number {
  const prop = props[key]
  if (!prop || prop.type !== 'number') return 0
  return prop.number ?? 0
}

export function getCheckbox(props: any, key: string): boolean {
  const prop = props[key]
  if (!prop || prop.type !== 'checkbox') return false
  return prop.checkbox ?? false
}

export function getDate(props: any, key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'date' || !prop.date) return null
  return prop.date.start || null
}

export function getStatus(props: any, key: string): string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'status') return null
  return prop.status?.name || null
}

export function getPeople(props: any, key: string): string[] {
  const prop = props[key]
  if (!prop || prop.type !== 'people') return []
  return prop.people?.map((p: any) => p.name).filter(Boolean) || []
}

export function getRelationIds(props: any, key: string): string[] {
  const prop = props[key]
  if (!prop || prop.type !== 'relation') return []
  return prop.relation?.map((r: any) => r.id) || []
}

export function getFormula(props: any, key: string): number | string | null {
  const prop = props[key]
  if (!prop || prop.type !== 'formula') return null
  const formula = prop.formula
  if (formula.type === 'number') return formula.number
  if (formula.type === 'string') return formula.string
  return null
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/notion/extractors.ts
git commit -m "refactor: add shared Notion property extractors"
```

---

## Chunk 2: Sync System

### Task 5: 프로젝트 동기화 API

**Files:**
- Create: `app/api/sync/projects/route.ts`

- [ ] **Step 1: 프로젝트 동기화 라우트 작성**

기존 creators/route.ts 패턴을 따르되, 공통 모듈 사용.

```typescript
// app/api/sync/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateSync } from '@/lib/sync-auth'
import {
  getTitle, getRichText, getSelect, getMultiSelect,
  getNumber, getDate, getStatus, getPeople, getRelationIds,
} from '@/lib/notion/extractors'
import { getJpyToKrwRate } from '@/lib/exchange-rate'

export const maxDuration = 60

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DATABASE_ID = process.env.NOTION_PROJECT_DB_ID!

interface SyncResult {
  synced: number
  errors: string[]
  exchangeRate: number | null
}

export async function POST(request: NextRequest) {
  // 인증
  let bodySecret: string | undefined
  try {
    const body = await request.clone().json()
    bodySecret = body?.secret
  } catch {
    // body parsing optional
  }

  const auth = authenticateSync(request, bodySecret)
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  const result: SyncResult = { synced: 0, errors: [], exchangeRate: null }

  try {
    // 환율 조회 (동기화 시작 시 1회)
    const jpyToKrw = await getJpyToKrwRate()
    result.exchangeRate = jpyToKrw

    // Notion 전체 페이지 fetch (cursor pagination)
    const allPages: any[] = []
    let cursor: string | undefined = undefined

    do {
      const response: any = await notion.databases.query({
        database_id: DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      })
      allPages.push(...response.results)
      cursor = response.has_more ? response.next_cursor : undefined
    } while (cursor)

    // 상위 항목 이름 매핑 (1차 패스)
    const pageNameMap = new Map<string, string>()
    for (const page of allPages) {
      const name = getTitle(page.properties, '프로젝트 이름')
      pageNameMap.set(page.id, name)
    }

    // Supabase upsert (2차 패스)
    const supabase = createAdminClient()

    for (const page of allPages) {
      try {
        const props = page.properties
        const parentIds = getRelationIds(props, '상위 항목')
        const parentId = parentIds[0] || null

        const project = {
          notion_id: page.id,
          name: getTitle(props, '프로젝트 이름'),
          parent_notion_id: parentId,
          brand_name: parentId ? (pageNameMap.get(parentId) || null) : null,
          status: getStatus(props, '상태'),
          priority: getSelect(props, '우선순위'),
          team: getMultiSelect(props, '팀'),
          project_type: getMultiSelect(props, '종류'),
          assignee_names: getPeople(props, '담당자'),
          contract_krw: getNumber(props, '계약 금액 (KRW, VAT 제외)'),
          contract_jpy: getNumber(props, '계약 금액 (JPY, VAT 제외)'),
          advance_payment_krw: getNumber(props, '선금 입금액 (KRW)'),
          advance_payment_jpy: getNumber(props, '선금 입금액 (JPY)'),
          creator_settlement_krw: getNumber(props, '크리에이터 정산 금액 (KRW)'),
          creator_settlement_jpy: getNumber(props, '크리에이터 정산 금액 (JPY)'),
          client_settlement: getSelect(props, '정산_클라이언트'),
          creator_settlement_status: getSelect(props, '정산_크리에이터'),
          contract_status: getSelect(props, '계약서'),
          estimate_status: getSelect(props, '견적서'),
          tax_invoice_status: getSelect(props, '세금계산서 발행'),
          start_date: getDate(props, '시작일'),
          end_date: getDate(props, '종료일'),
          note: getRichText(props, '비고'),
          influencer_info: getRichText(props, '진행 인플루언서'),
          settlement_progress: getRichText(props, '정산 진행률'),
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('projects')
          .upsert(project, { onConflict: 'notion_id' })

        if (error) {
          result.errors.push(`${project.name}: ${error.message}`)
        } else {
          result.synced++
        }
      } catch (err) {
        const name = getTitle(page.properties, '프로젝트 이름')
        result.errors.push(`${name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed', ...result },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 어드민 대시보드에 동기화 버튼 추가**

`components/admin/dashboard-page.tsx`에 프로젝트 동기화 버튼 추가. 기존 3개 버튼과 동일한 패턴.

기존 파일을 읽고, `portfolioSyncing` 상태와 동일하게 `projectSyncing` 상태 추가. `handleSync` 함수에 `'projects'` 케이스 추가. 버튼 UI 추가. 통계에 projects count 추가.

- [ ] **Step 3: 커밋**

```bash
git add app/api/sync/projects/route.ts components/admin/dashboard-page.tsx
git commit -m "feat: add project sync API and admin button"
```

---

### Task 6: launchd 자동화

**Files:**
- Create: `~/Library/LaunchAgents/com.krns.sync-projects.plist`
- Reference: 기존 `com.krns.follower-update.plist` 패턴

- [ ] **Step 1: plist 파일 작성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.krns.sync-projects</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/curl</string>
        <string>-s</string>
        <string>-X</string>
        <string>POST</string>
        <string>-H</string>
        <string>Authorization: Bearer SYNC_SECRET_VALUE</string>
        <string>-H</string>
        <string>Content-Type: application/json</string>
        <string>https://koreaners.co/api/sync/projects</string>
    </array>
    <key>StartInterval</key>
    <integer>600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/sync-projects.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/sync-projects-error.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

**중요**: plist 작성 전 `.env.local`에서 `SYNC_SECRET` 값을 읽어 `SYNC_SECRET_VALUE` 자리에 치환해야 합니다:

```bash
# .env.local에서 SYNC_SECRET 값 추출
SYNC_SECRET=$(grep SYNC_SECRET /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page/.env.local | cut -d= -f2)
echo "Bearer token: $SYNC_SECRET"
```

이 값을 plist의 `Authorization: Bearer SYNC_SECRET_VALUE` 부분에 삽입합니다.

- [ ] **Step 2: launchd 등록**

```bash
launchctl load ~/Library/LaunchAgents/com.krns.sync-projects.plist
```

- [ ] **Step 3: 동기화 테스트 및 커밋**

로컬에서 `curl -X POST http://localhost:3000/api/sync/projects` 호출하여 정상 동작 확인.

```bash
git add app/api/sync/projects/route.ts
git commit -m "feat: add launchd auto-sync for projects (10min interval)"
```

---

## Chunk 3: Dashboard UI

### Task 7: 대시보드 공통 컴포넌트

**Files:**
- Create: `components/admin/dashboard/kpi-card.tsx`
- Create: `components/admin/dashboard/charts.tsx`
- Create: `lib/dashboard/calculations.ts`
- Create: `lib/dashboard/queries.ts`

- [ ] **Step 1: 미수금/환산 계산 로직**

```typescript
// lib/dashboard/calculations.ts

export interface Project {
  id: string
  notion_id: string
  name: string
  parent_notion_id: string | null
  brand_name: string | null
  status: string | null
  priority: string | null
  team: string[]
  project_type: string[]
  assignee_names: string[]
  contract_krw: number
  contract_jpy: number
  advance_payment_krw: number
  advance_payment_jpy: number
  creator_settlement_krw: number
  creator_settlement_jpy: number
  client_settlement: string | null
  creator_settlement_status: string | null
  contract_status: string | null
  estimate_status: string | null
  tax_invoice_status: string | null
  start_date: string | null
  end_date: string | null
  note: string | null
  influencer_info: string | null
  settlement_progress: string | null
}

/** 총 계약금액 (KRW 환산) */
export function totalContractKrw(p: Project, jpyRate: number): number {
  return p.contract_krw + p.contract_jpy * jpyRate
}

/** 총 선금 (KRW 환산) */
export function totalAdvanceKrw(p: Project, jpyRate: number): number {
  return p.advance_payment_krw + p.advance_payment_jpy * jpyRate
}

/** 미수금 (KRW 환산) — 입금 완료가 아닌 경우만 */
export function receivableKrw(p: Project, jpyRate: number): number {
  if (p.client_settlement === '입금 완료') return 0
  return totalContractKrw(p, jpyRate) - totalAdvanceKrw(p, jpyRate)
}

/** 프로젝트 기간 (일) */
export function projectDurationDays(p: Project): number | null {
  if (!p.start_date || !p.end_date) return null
  const start = new Date(p.start_date)
  const end = new Date(p.end_date)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}
```

- [ ] **Step 2: Supabase 쿼리 함수**

```typescript
// lib/dashboard/queries.ts
import { createBrowserClient } from '@/lib/supabase/client'
import type { Project } from './calculations'

export async function fetchAllProjects(): Promise<Project[]> {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name')

  if (error) throw error
  return (data || []) as Project[]
}

export async function fetchLatestExchangeRate(): Promise<number> {
  const supabase = createBrowserClient()
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('currency_pair', 'JPY_KRW')
    .order('rate_date', { ascending: false })
    .limit(1)
    .single()

  return data ? Number(data.rate) : 9.0
}
```

- [ ] **Step 3: KPI 카드 컴포넌트**

```tsx
// components/admin/dashboard/kpi-card.tsx
'use client'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 차트 래퍼 컴포넌트**

```tsx
// components/admin/dashboard/charts.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#FF4500', '#141414', '#666666', '#999999', '#CCCCCC', '#FF6B35']

interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}

export function StatusBarChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={90} />
        <Tooltip />
        <Bar dataKey="value" fill="#FF4500" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TeamDonutChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label={({ name, value }) => `${name}: ${value}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function MonthlyLineChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
        <Line type="monotone" dataKey="value" stroke="#FF4500" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TrendLineChart({ data }: { data: Array<{ name: string; new: number; completed: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="new" name="신규" stroke="#FF4500" strokeWidth={2} />
        <Line type="monotone" dataKey="completed" name="완료" stroke="#141414" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function WorkloadBarChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#FF4500" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 5: 커밋**

```bash
git add lib/dashboard/ components/admin/dashboard/
git commit -m "feat: add dashboard shared components (KPI card, charts, queries)"
```

---

### Task 8: 대시보드 레이아웃 + 경영 대시보드

**Files:**
- Create: `app/admin/dashboard/layout.tsx`
- Create: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: 탭 네비게이션 Client Component**

```tsx
// components/admin/dashboard/dashboard-tabs.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin/dashboard', label: '경영' },
  { href: '/admin/dashboard/team', label: '팀원' },
  { href: '/admin/dashboard/report', label: '보고' },
]

export function DashboardTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 1b: 대시보드 레이아웃 (Server Component)**

```tsx
// app/admin/dashboard/layout.tsx
import Link from 'next/link'
import { DashboardTabs } from '@/components/admin/dashboard/dashboard-tabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline">
          ← 어드민
        </Link>
      </div>
      <DashboardTabs />
      {children}
    </div>
  )
}
```

- [ ] **Step 2: 경영 대시보드 페이지**

```tsx
// app/admin/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { StatusBarChart, TeamDonutChart, MonthlyLineChart } from '@/components/admin/dashboard/charts'
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
import { totalContractKrw, receivableKrw, type Project } from '@/lib/dashboard/calculations'

export default function ExecutiveDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [jpyRate, setJpyRate] = useState(9.0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, rate] = await Promise.all([
          fetchAllProjects(),
          fetchLatestExchangeRate(),
        ])
        setProjects(p)
        setJpyRate(rate)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="py-8 text-center text-muted-foreground">로딩 중...</div>

  // 하위 프로젝트만 (parent_notion_id가 있는 것)
  const subProjects = projects.filter(p => p.parent_notion_id)

  // KPI
  const totalCount = subProjects.length
  const inProgressCount = subProjects.filter(p =>
    p.status && !['완료', 'Drop', '시작 전', '보류'].includes(p.status)
  ).length
  const totalContract = subProjects.reduce((sum, p) => sum + totalContractKrw(p, jpyRate), 0)
  const totalReceivable = subProjects.reduce((sum, p) => sum + receivableKrw(p, jpyRate), 0)

  // 상태별 분포
  const statusCounts = new Map<string, number>()
  subProjects.forEach(p => {
    const s = p.status || '미지정'
    statusCounts.set(s, (statusCounts.get(s) || 0) + 1)
  })
  const statusData = Array.from(statusCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 팀별 분포
  const teamCounts = new Map<string, number>()
  subProjects.forEach(p => {
    p.team?.forEach(t => teamCounts.set(t, (teamCounts.get(t) || 0) + 1))
  })
  const teamData = Array.from(teamCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 월별 계약금액 추이 (최근 6개월)
  const monthlyData: { name: string; value: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthProjects = subProjects.filter(p => p.start_date?.startsWith(monthStr))
    const total = monthProjects.reduce((sum, p) => sum + totalContractKrw(p, jpyRate), 0)
    monthlyData.push({ name: monthStr, value: total })
  }

  // 미수금 TOP 10
  const receivableProjects = subProjects
    .map(p => ({ name: p.brand_name ? `${p.brand_name} > ${p.name}` : p.name, receivable: receivableKrw(p, jpyRate), status: p.client_settlement }))
    .filter(p => p.receivable > 0)
    .sort((a, b) => b.receivable - a.receivable)
    .slice(0, 10)

  const fmt = (n: number) => `₩${Math.round(n).toLocaleString()}`

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="총 프로젝트" value={totalCount} />
        <KpiCard title="진행 중" value={inProgressCount} />
        <KpiCard title="총 계약금액" value={fmt(totalContract)} />
        <KpiCard title="미수금" value={fmt(totalReceivable)} subtitle={`환율: ¥1 = ₩${jpyRate.toFixed(2)}`} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">상태별 프로젝트</h3>
          <StatusBarChart data={statusData} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">팀별 프로젝트</h3>
          <TeamDonutChart data={teamData} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">월별 계약금액 추이</h3>
          <MonthlyLineChart data={monthlyData} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">미수금 TOP 10</h3>
          <div className="space-y-2">
            {receivableProjects.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate mr-4">{p.name}</span>
                <span className="font-mono font-medium whitespace-nowrap">{fmt(p.receivable)}</span>
              </div>
            ))}
            {receivableProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">미수금 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/dashboard/
git commit -m "feat: add executive dashboard with KPI cards and charts"
```

---

### Task 9: 팀원 대시보드

**Files:**
- Create: `app/admin/dashboard/team/page.tsx`
- Create: `components/admin/dashboard/project-table.tsx`

- [ ] **Step 1: 프로젝트 테이블 컴포넌트**

```tsx
// components/admin/dashboard/project-table.tsx
'use client'

import type { Project } from '@/lib/dashboard/calculations'
import { totalContractKrw, receivableKrw } from '@/lib/dashboard/calculations'

const statusColors: Record<string, string> = {
  '시작 전': 'bg-gray-100 text-gray-800',
  '보류': 'bg-pink-100 text-pink-800',
  '진행 중': 'bg-blue-100 text-blue-800',
  '검토 중': 'bg-purple-100 text-purple-800',
  '리스트업 중': 'bg-orange-100 text-orange-800',
  '리스트 전달': 'bg-orange-100 text-orange-800',
  '인플루언서 섭외': 'bg-green-100 text-green-800',
  '클라이언트 정산 중': 'bg-blue-100 text-blue-800',
  '인플루언서 정산 중': 'bg-blue-100 text-blue-800',
  '완료': 'bg-green-100 text-green-800',
  'Drop': 'bg-red-100 text-red-800',
}

const priorityOrder = ['🔥TODAY', '높음', '보통', '낮음']

const checkIcon = '✓'
const crossIcon = '—'

function docBadge(status: string | null): string {
  if (!status) return crossIcon
  if (status === '스킵') return crossIcon
  if (['전달 완료', '계약 완료', '발행 완료'].includes(status)) return checkIcon
  return '…'
}

interface ProjectTableProps {
  projects: Project[]
  jpyRate: number
}

export function ProjectTable({ projects, jpyRate }: ProjectTableProps) {
  const sorted = [...projects].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.priority || '')
    const bi = priorityOrder.indexOf(b.priority || '')
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const fmt = (n: number) => `₩${Math.round(n).toLocaleString()}`

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4">프로젝트</th>
            <th className="py-2 pr-4">브랜드</th>
            <th className="py-2 pr-4">상태</th>
            <th className="py-2 pr-4">우선순위</th>
            <th className="py-2 pr-2 text-center" title="계약서">계</th>
            <th className="py-2 pr-2 text-center" title="견적서">견</th>
            <th className="py-2 pr-2 text-center" title="세금계산서">세</th>
            <th className="py-2 pr-2 text-center">정산</th>
            <th className="py-2 pr-4 text-right">계약금액</th>
            <th className="py-2 text-right">미수금</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.id} className="border-b hover:bg-muted/50">
              <td className="py-2 pr-4 font-medium">{p.name}</td>
              <td className="py-2 pr-4 text-muted-foreground">{p.brand_name || '—'}</td>
              <td className="py-2 pr-4">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusColors[p.status || ''] || 'bg-gray-100'}`}>
                  {p.status || '—'}
                </span>
              </td>
              <td className="py-2 pr-4">{p.priority || '—'}</td>
              <td className="py-2 pr-2 text-center">{docBadge(p.contract_status)}</td>
              <td className="py-2 pr-2 text-center">{docBadge(p.estimate_status)}</td>
              <td className="py-2 pr-2 text-center">{docBadge(p.tax_invoice_status)}</td>
              <td className="py-2 pr-2 text-center text-xs">{p.client_settlement || '—'}</td>
              <td className="py-2 pr-4 text-right font-mono">{fmt(totalContractKrw(p, jpyRate))}</td>
              <td className="py-2 text-right font-mono">{fmt(receivableKrw(p, jpyRate))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: 팀원 대시보드 페이지**

```tsx
// app/admin/dashboard/team/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { ProjectTable } from '@/components/admin/dashboard/project-table'
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
import { receivableKrw, type Project } from '@/lib/dashboard/calculations'

export default function TeamDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [jpyRate, setJpyRate] = useState(9.0)
  const [loading, setLoading] = useState(true)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('전체')

  useEffect(() => {
    async function load() {
      try {
        const [p, rate] = await Promise.all([
          fetchAllProjects(),
          fetchLatestExchangeRate(),
        ])
        setProjects(p)
        setJpyRate(rate)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // 하위 프로젝트만
  const subProjects = useMemo(() => projects.filter(p => p.parent_notion_id), [projects])

  // 담당자 목록
  const assignees = useMemo(() => {
    const set = new Set<string>()
    subProjects.forEach(p => p.assignee_names?.forEach(a => set.add(a)))
    return ['전체', ...Array.from(set).sort()]
  }, [subProjects])

  // 필터링
  const filtered = useMemo(() => {
    if (selectedAssignee === '전체') return subProjects
    return subProjects.filter(p => p.assignee_names?.includes(selectedAssignee))
  }, [subProjects, selectedAssignee])

  if (loading) return <div className="py-8 text-center text-muted-foreground">로딩 중...</div>

  const myCount = filtered.length
  const urgentCount = filtered.filter(p => p.priority === '🔥TODAY' || p.priority === '높음').length
  const myReceivable = filtered.reduce((sum, p) => sum + receivableKrw(p, jpyRate), 0)
  const fmt = (n: number) => `₩${Math.round(n).toLocaleString()}`

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">담당자:</label>
        <select
          value={selectedAssignee}
          onChange={e => setSelectedAssignee(e.target.value)}
          className="rounded border bg-background px-3 py-1.5 text-sm"
        >
          {assignees.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="프로젝트 수" value={myCount} />
        <KpiCard title="높음/TODAY" value={urgentCount} />
        <KpiCard title="미수금" value={fmt(myReceivable)} />
      </div>

      {/* Project Table */}
      <div className="rounded-lg border bg-card p-4">
        <ProjectTable projects={filtered} jpyRate={jpyRate} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/dashboard/team/ components/admin/dashboard/project-table.tsx
git commit -m "feat: add team dashboard with assignee filter and project table"
```

---

### Task 10: 보고용 대시보드

**Files:**
- Create: `app/admin/dashboard/report/page.tsx`
- Create: `components/admin/dashboard/brand-accordion.tsx`

- [ ] **Step 1: 브랜드 아코디언 컴포넌트**

```tsx
// components/admin/dashboard/brand-accordion.tsx
'use client'

import { useState } from 'react'
import type { Project } from '@/lib/dashboard/calculations'
import { totalContractKrw, receivableKrw } from '@/lib/dashboard/calculations'

interface BrandGroup {
  brandName: string
  projects: Project[]
  totalContract: number
  totalReceivable: number
}

interface BrandAccordionProps {
  groups: BrandGroup[]
  jpyRate: number
}

export function BrandAccordion({ groups, jpyRate }: BrandAccordionProps) {
  const [openBrands, setOpenBrands] = useState<Set<string>>(new Set())
  const fmt = (n: number) => `₩${Math.round(n).toLocaleString()}`

  const toggle = (brand: string) => {
    const next = new Set(openBrands)
    if (next.has(brand)) next.delete(brand)
    else next.add(brand)
    setOpenBrands(next)
  }

  return (
    <div className="space-y-1">
      {groups.map(g => (
        <div key={g.brandName} className="border rounded-lg">
          <button
            onClick={() => toggle(g.brandName)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50"
          >
            <span>{g.brandName} ({g.projects.length}건)</span>
            <div className="flex items-center gap-4">
              <span className="font-mono">{fmt(g.totalContract)}</span>
              {g.totalReceivable > 0 && (
                <span className="font-mono text-red-500">{fmt(g.totalReceivable)}</span>
              )}
              <span className="text-muted-foreground">{openBrands.has(g.brandName) ? '▲' : '▼'}</span>
            </div>
          </button>
          {openBrands.has(g.brandName) && (
            <div className="border-t px-4 py-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">프로젝트</th>
                    <th className="py-1">상태</th>
                    <th className="py-1">담당자</th>
                    <th className="py-1 text-right">계약금액</th>
                    <th className="py-1 text-right">정산</th>
                  </tr>
                </thead>
                <tbody>
                  {g.projects.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="py-1">{p.name}</td>
                      <td className="py-1">{p.status || '—'}</td>
                      <td className="py-1">{p.assignee_names?.join(', ') || '—'}</td>
                      <td className="py-1 text-right font-mono">{fmt(totalContractKrw(p, jpyRate))}</td>
                      <td className="py-1 text-right">{p.client_settlement || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 보고용 대시보드 페이지**

```tsx
// app/admin/dashboard/report/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { WorkloadBarChart, TrendLineChart } from '@/components/admin/dashboard/charts'
import { BrandAccordion } from '@/components/admin/dashboard/brand-accordion'
import { fetchAllProjects, fetchLatestExchangeRate } from '@/lib/dashboard/queries'
import {
  totalContractKrw, receivableKrw, projectDurationDays, type Project,
} from '@/lib/dashboard/calculations'

export default function ReportDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [jpyRate, setJpyRate] = useState(9.0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, rate] = await Promise.all([
          fetchAllProjects(),
          fetchLatestExchangeRate(),
        ])
        setProjects(p)
        setJpyRate(rate)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const subProjects = useMemo(() => projects.filter(p => p.parent_notion_id), [projects])

  if (loading) return <div className="py-8 text-center text-muted-foreground">로딩 중...</div>

  // KPI
  const totalContract = subProjects.reduce((sum, p) => sum + totalContractKrw(p, jpyRate), 0)
  const totalReceivable = subProjects.reduce((sum, p) => sum + receivableKrw(p, jpyRate), 0)
  const completedCount = subProjects.filter(p => p.status === '완료').length
  const durations = subProjects.map(projectDurationDays).filter((d): d is number => d !== null)
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

  const fmt = (n: number) => `₩${Math.round(n).toLocaleString()}`

  // 브랜드별 그룹핑
  const brandGroups = useMemo(() => {
    const map = new Map<string, Project[]>()
    subProjects.forEach(p => {
      const brand = p.brand_name || '미분류'
      if (!map.has(brand)) map.set(brand, [])
      map.get(brand)!.push(p)
    })
    return Array.from(map.entries())
      .map(([brandName, projects]) => ({
        brandName,
        projects,
        totalContract: projects.reduce((s, p) => s + totalContractKrw(p, jpyRate), 0),
        totalReceivable: projects.reduce((s, p) => s + receivableKrw(p, jpyRate), 0),
      }))
      .sort((a, b) => b.totalContract - a.totalContract)
  }, [subProjects, jpyRate])

  // 담당자별 업무량
  const workloadData = useMemo(() => {
    const map = new Map<string, number>()
    subProjects.forEach(p => {
      p.assignee_names?.forEach(a => map.set(a, (map.get(a) || 0) + 1))
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [subProjects])

  // 월간 트렌드 (최근 6개월, 시작일 = 신규, 종료일+완료 = 완료)
  const trendData = useMemo(() => {
    const data: Array<{ name: string; new: number; completed: number }> = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      data.push({
        name: monthStr,
        new: subProjects.filter(p => p.start_date?.startsWith(monthStr)).length,
        completed: subProjects.filter(p => p.status === '완료' && p.end_date?.startsWith(monthStr)).length,
      })
    }
    return data
  }, [subProjects])

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="전체 계약금액" value={fmt(totalContract)} />
        <KpiCard title="미수금" value={fmt(totalReceivable)} />
        <KpiCard title="완료 프로젝트" value={completedCount} />
        <KpiCard title="평균 기간" value={`${avgDuration}일`} />
      </div>

      {/* Brand Accordion */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 font-semibold">브랜드별 현황</h3>
        <BrandAccordion groups={brandGroups} jpyRate={jpyRate} />
      </div>

      {/* Bottom Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">담당자별 업무량</h3>
          <WorkloadBarChart data={workloadData} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">월간 트렌드</h3>
          <TrendLineChart data={trendData} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/admin/dashboard/report/ components/admin/dashboard/brand-accordion.tsx
git commit -m "feat: add report dashboard with brand accordion and trend charts"
```

---

### Task 11: 어드민 페이지에 대시보드 링크 추가

**Files:**
- Modify: `components/admin/dashboard-page.tsx`

- [ ] **Step 1: 대시보드 링크 추가**

기존 어드민 메인 페이지에 대시보드로 이동하는 링크/버튼 추가.

`components/admin/dashboard-page.tsx`를 읽고, 상단에 다음과 같은 링크를 추가:

```tsx
import Link from 'next/link'

// 기존 코드 상단에 추가
<Link
  href="/admin/dashboard"
  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
>
  대시보드 보기 →
</Link>
```

- [ ] **Step 2: 프로젝트 동기화 버튼 추가**

기존 동기화 버튼들과 동일한 패턴으로 프로젝트 동기화 버튼 추가.

- [ ] **Step 3: 전체 빌드 확인**

```bash
cd /Users/leo/Downloads/Claude-Projects/koreaners-global-landing-page
npm run build
```

빌드 에러 없으면 성공.

- [ ] **Step 4: 커밋**

```bash
git add components/admin/dashboard-page.tsx
git commit -m "feat: add dashboard link and project sync button to admin page"
```

---

## Chunk 4: Integration & Deploy

### Task 12: 통합 테스트 및 배포

- [ ] **Step 1: 로컬에서 동기화 테스트**

```bash
# 개발 서버 실행
npm run dev

# 동기화 호출
curl -X POST http://localhost:3000/api/sync/projects
```

응답에 `synced` 숫자 확인. Supabase에서 projects 테이블 데이터 확인.

- [ ] **Step 2: 대시보드 3개 페이지 확인**

브라우저에서:
1. `http://localhost:3000/admin/dashboard` — KPI 카드 4개, 차트 4개 렌더링 확인
2. `http://localhost:3000/admin/dashboard/team` — 담당자 드롭다운, 테이블 렌더링 확인
3. `http://localhost:3000/admin/dashboard/report` — 브랜드 아코디언, 차트 렌더링 확인

- [ ] **Step 3: Vercel 환경변수 추가**

Vercel 프로젝트 설정에 추가:
- `NOTION_PROJECT_DB_ID`
- `BOK_ECOS_API_KEY`

- [ ] **Step 4: 배포**

```bash
git push origin main
```

Vercel 자동 배포 확인.

- [ ] **Step 5: launchd 등록 및 프로덕션 동기화 확인**

```bash
launchctl load ~/Library/LaunchAgents/com.krns.sync-projects.plist
```

10분 후 로그 확인:
```bash
cat /tmp/sync-projects.log
```
