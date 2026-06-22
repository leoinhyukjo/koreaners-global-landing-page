'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import {
  fetchSalesLeads,
  fetchMonthlyFlow,
  flowLabel,
  buildMonthly,
  fmtKrw,
  monthKr,
  daysSince,
  budgetKrw,
  SECTION_ORDER,
  type SalesLead,
  type MonthlyFlow,
} from '@/lib/dashboard/sales'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { MonthlyBarChart, MonthlyFlowChart } from '@/components/admin/dashboard/charts'
import {
  DateFilterBar,
  DEFAULT_DATE_FILTER,
  computeDateRange,
  matchesDateRange,
  type DateFilter,
} from '@/components/admin/dashboard/date-filter-bar'

export const dynamic = 'force-dynamic'

const SECTION_LABEL: Record<string, string> = {
  협상중: '협상 중',
  '운영 중': '운영 중',
  스톨: '스톨 (정체)',
}

// --- 정렬 ---
type SortKey = 'name' | 'funnel' | 'first' | 'last' | 'budget' | 'pay'
type SortState = { key: SortKey; dir: 'asc' | 'desc' } | null

function mdNum(md: string): number {
  // 'M/D' → M*100+D (정렬용). 빈값은 맨 뒤로 가도록 큰 값.
  const m = /^(\d{1,2})\/(\d{1,2})/.exec(md || '')
  return m ? parseInt(m[1], 10) * 100 + parseInt(m[2], 10) : -1
}

const SORT_GET: Record<SortKey, (r: SalesLead) => number | string> = {
  name: (r) => r.name,
  funnel: (r) => r.funnel,
  first: (r) => mdNum(r.first_contact),
  last: (r) => r.last_action_date ?? '',
  budget: (r) => budgetKrw(r.budget_amount),
  pay: (r) => (r.undetermined ? -1 : (r.seon_krw ?? 0) + (r.jan_krw ?? 0)),
}

// 헤더 7칼럼(colgroup 순서와 일치). 비고는 정렬 불가.
const COLUMNS: { label: string; key?: SortKey }[] = [
  { label: '클라이언트', key: 'name' },
  { label: '퍼널', key: 'funnel' },
  { label: '최초', key: 'first' },
  { label: '최근', key: 'last' },
  { label: '예산', key: 'budget' },
  { label: '예상 입금', key: 'pay' },
  { label: '비고/현황' },
]

function sortRows(rows: SalesLead[], sort: SortState): SalesLead[] {
  if (!sort) return rows // 정렬 미지정 시 원본(퍼널 그룹) 순서 유지
  const get = SORT_GET[sort.key]
  const mul = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = get(a)
    const vb = get(b)
    const r =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'ko')
    return r * mul
  })
}

function PaymentCell({ r }: { r: SalesLead }) {
  if (r.undetermined) return <span className="text-neutral-600">미정</span>
  const est = r.conf && r.conf !== '확정'
  return (
    <div className="space-y-0.5 leading-tight">
      {r.seon_month === '기수령' ? (
        <div className="text-neutral-600">선금 기수령</div>
      ) : (
        <div className="text-amber-300/90">
          {monthKr(r.seon_month)} 선금 {fmtKrw(r.seon_krw)}
        </div>
      )}
      <div className="text-emerald-400/90">
        {monthKr(r.jan_month)} 잔금 {fmtKrw(r.jan_krw)}
        {est && <span className="ml-1 text-[10px] text-neutral-500">추정</span>}
      </div>
    </div>
  )
}

function BudgetCell({ r }: { r: SalesLead }) {
  const done = r.budget_tag === '합의완료'
  return (
    <div className="space-y-1">
      {r.budget_amount && <div className="text-xs font-medium text-neutral-200">{r.budget_amount}</div>}
      <span
        className={[
          'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold',
          done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-800 text-neutral-400',
        ].join(' ')}
      >
        {done ? '합의완료' : '미정'}
      </span>
    </div>
  )
}

function SectionTable({
  rows,
  sort,
  onSort,
}: {
  rows: SalesLead[]
  sort: SortState
  onSort: (key: SortKey) => void
}) {
  const sorted = sortRows(rows, sort)
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full min-w-[864px] table-fixed text-sm">
        <colgroup>
          <col className="w-[124px]" />
          <col className="w-[92px]" />
          <col className="w-[64px]" />
          <col className="w-[64px]" />
          <col className="w-[96px]" />
          <col className="w-[140px]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-neutral-800 text-left text-[11px] text-neutral-500">
            {COLUMNS.map((c) => {
              const active = sort?.key === c.key
              return (
                <th key={c.label} className="px-3 py-2 font-medium">
                  {c.key ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.key as SortKey)}
                      title="클릭하여 정렬"
                      className={[
                        'inline-flex items-center gap-0.5 transition-colors hover:text-neutral-200',
                        active ? 'text-orange-400' : '',
                      ].join(' ')}
                    >
                      {c.label}
                      {active ? (
                        sort!.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <ChevronDown className="h-3 w-3 shrink-0" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 shrink-0 text-neutral-600" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            return (
              <tr
                key={`${r.section}-${r.name}`}
                className="align-top text-neutral-300 odd:bg-neutral-900/30 border-b border-neutral-800/40"
              >
                <td className="px-3 py-2 font-semibold text-neutral-100 break-keep">{r.name}</td>
                <td className="px-3 py-2 text-xs text-neutral-500 break-keep">{r.funnel}</td>
                <td className="whitespace-nowrap px-3 py-2 text-[11px] text-neutral-500">{r.first_contact || '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-[11px] text-neutral-500">{r.last_action || '—'}</td>
                <td className="px-3 py-2"><BudgetCell r={r} /></td>
                <td className="px-3 py-2 text-[11px]"><PaymentCell r={r} /></td>
                <td className="px-3 py-2 text-[12px] leading-relaxed text-neutral-400 break-words">{r.bigo}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function SalesPage() {
  const [rows, setRows] = useState<SalesLead[]>([])
  const [flow, setFlow] = useState<MonthlyFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DateFilter>(DEFAULT_DATE_FILTER)
  const [sort, setSort] = useState<SortState>(null)
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  useEffect(() => {
    fetchSalesLeads().then((r) => {
      setRows(r)
      setLoading(false)
    })
    fetchMonthlyFlow().then(setFlow)
  }, [])

  // 1월부터 연속 축으로 표시(빠진 달 0). 1~2월은 리드 트래킹 도입 전이라 데이터 미완 → 흐리게.
  const flowPoints = useMemo(() => {
    const START = '2026-01'
    const INCOMPLETE = new Set(['2026-01', '2026-02'])
    const by = new Map(flow.map((f) => [f.month, f]))
    const latest = flow.length ? flow[flow.length - 1].month : START
    const months: string[] = []
    let [y, m] = START.split('-').map(Number)
    const [ly, lm] = latest.split('-').map(Number)
    while (y < ly || (y === ly && m <= lm)) {
      months.push(`${y}-${String(m).padStart(2, '0')}`)
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
    return months.map((key) => {
      const f = by.get(key)
      return {
        label: flowLabel(key),
        intake: f?.intake ?? 0,
        contracted: f?.contracted ?? 0,
        incomplete: INCOMPLETE.has(key),
      }
    })
  }, [flow])

  const range = useMemo(() => computeDateRange(filter), [filter])
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        // 최근 대응일 없는 건은 파이프라인에서 숨기지 않음(스톨 등 누락 방지)
        if (!r.last_action_date) return true
        return matchesDateRange({ start_date: r.last_action_date, end_date: r.last_action_date }, range)
      }),
    [rows, range],
  )

  const monthly = useMemo(() => buildMonthly(filtered), [filtered])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of filtered) c[r.section] = (c[r.section] || 0) + 1
    return c
  }, [filtered])
  const atRisk = useMemo(
    () =>
      filtered.filter(
        (r) => (r.section === '협상중' || r.section === '스톨') && (daysSince(r.last_action_date) ?? 0) >= 14,
      ).length,
    [filtered],
  )
  const generatedAt = rows.find((r) => r.generated_at)?.generated_at?.replace('T', ' ').slice(0, 16)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-neutral-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-900" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-neutral-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300">
            <ArrowLeft className="h-3.5 w-3.5" />
            어드민
          </Link>
          <h1 className="text-lg font-semibold text-neutral-50">세일즈 현황</h1>
        </div>
        {generatedAt && <span className="text-[11px] text-neutral-600 tabular-nums">{generatedAt} 기준</span>}
      </div>

      <DateFilterBar value={filter} onChange={setFilter} totalCount={rows.length} filteredCount={filtered.length} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard title="협상 중" value={counts['협상중'] ?? 0} subtitle="진행 영업 건" />
        <KpiCard title="운영 중" value={counts['운영 중'] ?? 0} subtitle="계약 후 운영" />
        <KpiCard title="예상 입금 합" value={`₩${fmtKrw(monthly.grand.total)}`} subtitle={`전체 기간 누적 · 전망 ${monthly.forecastN}건`} />
        <KpiCard title="정체 위험" value={atRisk} subtitle="협상·스톨 14일+ 무대응" />
      </div>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 border-b border-neutral-800 pb-1.5 text-base font-semibold text-neutral-100">
          월별 흐름
          <span className="text-[11px] font-normal text-neutral-500">신규 인입 vs 체결</span>
        </h2>
        {flowPoints.length === 0 ? (
          <p className="text-xs text-neutral-500">흐름 데이터가 없습니다.</p>
        ) : (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
            <MonthlyFlowChart data={flowPoints} />
            <p className="mt-1 px-1 text-[11px] leading-relaxed text-neutral-500">
              신규 인입 = 그 달 들어온 리드(intake_date), 체결 = 그 달 계약 성사(contracted_date,
              현재도 체결·운영·완료인 건만 = 역행 제외). 영업 흐름을 월 단위 이벤트로 집계 — 일별 잡음 없음.
              1~2월은 리드 트래킹 도입 전이라 데이터 미완(흐리게 표시, 참고용).
            </p>
          </div>
        )}
      </section>

      {SECTION_ORDER.map((sec) => {
        const secRows = filtered.filter((r) => r.section === sec)
        if (secRows.length === 0) return null
        return (
          <section key={sec} className="space-y-2">
            <h2 className="flex items-center gap-2 border-b border-neutral-800 pb-1.5 text-base font-semibold text-neutral-100">
              {SECTION_LABEL[sec] ?? sec}
              <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-neutral-200">
                {secRows.length}
              </span>
            </h2>
            <SectionTable rows={secRows} sort={sort} onSort={toggleSort} />
          </section>
        )
      })}

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 border-b border-neutral-800 pb-1.5 text-base font-semibold text-neutral-100">
          월별 예상 입금 전망
          <span className="text-[11px] font-normal text-neutral-500">합계 약 {fmtKrw(monthly.grand.total)}</span>
        </h2>
        {monthly.months.length === 0 ? (
          <p className="text-xs text-neutral-500">전망 가능한 건이 없습니다 (예산·일정 근거 부족).</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-right text-[11px] text-neutral-500">
                    <th className="px-3 py-2 text-left font-medium">　</th>
                    {monthly.months.map((m) => (
                      <th key={m} className="px-3 py-2 font-medium">{monthKr(m)}</th>
                    ))}
                    <th className="border-l border-neutral-800 px-3 py-2 font-medium">합계</th>
                  </tr>
                </thead>
                <tbody className="text-right tabular-nums">
                  {(['seon', 'jan'] as const).map((kind) => (
                    <tr key={kind} className="text-neutral-300 odd:bg-neutral-900/30">
                      <td className="px-3 py-2 text-left font-semibold text-neutral-400">
                        {kind === 'seon' ? '선금' : '잔금'}
                      </td>
                      {monthly.months.map((m) => (
                        <td key={m} className="px-3 py-2">
                          {monthly.byMonth[m][kind] ? fmtKrw(monthly.byMonth[m][kind]) : <span className="text-neutral-700">—</span>}
                        </td>
                      ))}
                      <td className="border-l border-neutral-800 px-3 py-2 font-bold text-neutral-100">
                        {fmtKrw(kind === 'seon' ? monthly.grand.seon : monthly.grand.jan)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-neutral-700 font-bold text-neutral-100">
                    <td className="px-3 py-2 text-left">합계</td>
                    {monthly.months.map((m) => (
                      <td key={m} className="px-3 py-2">{fmtKrw(monthly.byMonth[m].total)}</td>
                    ))}
                    <td className="border-l border-neutral-800 px-3 py-2">{fmtKrw(monthly.grand.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
              <MonthlyBarChart data={monthly.months.map((m) => ({ month: monthKr(m), amount: monthly.byMonth[m].total }))} />
            </div>
          </>
        )}
        <p className="text-[11px] leading-relaxed text-neutral-500">
          전망 {monthly.forecastN}건 기준 (일정 또는 예산 근거 부족 {monthly.undeterminedN}건 제외).
          입금은 클라이언트 결제액 기준, 선금 50%는 예상 계약(클로징)월 잔금 50%는 캠페인 게시월 추정.
          운영 중은 선금 기수령으로 보아 잔금만 반영. 예산 범위는 중간값.
        </p>
      </section>
    </div>
  )
}
