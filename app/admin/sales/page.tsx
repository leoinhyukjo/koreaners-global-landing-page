'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  fetchSalesLeads,
  buildMonthly,
  fmtKrw,
  monthKr,
  daysSince,
  SECTION_ORDER,
  type SalesLead,
} from '@/lib/dashboard/sales'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { MonthlyBarChart } from '@/components/admin/dashboard/charts'
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

function SectionTable({ rows }: { rows: SalesLead[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full min-w-[820px] table-fixed text-sm">
        <colgroup>
          <col className="w-[124px]" />
          <col className="w-[92px]" />
          <col className="w-[48px]" />
          <col className="w-[48px]" />
          <col className="w-[96px]" />
          <col className="w-[140px]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-neutral-800 text-left text-[11px] text-neutral-500">
            <th className="px-3 py-2 font-medium">클라이언트</th>
            <th className="px-3 py-2 font-medium">퍼널</th>
            <th className="px-3 py-2 font-medium">최초</th>
            <th className="px-3 py-2 font-medium">최근</th>
            <th className="px-3 py-2 font-medium">예산</th>
            <th className="px-3 py-2 font-medium">예상 입금</th>
            <th className="px-3 py-2 font-medium">비고/현황</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const divider = i > 0 && rows[i - 1].funnel !== r.funnel
            return (
              <tr
                key={`${r.section}-${r.name}`}
                className={[
                  'align-top text-neutral-300 odd:bg-neutral-900/30',
                  divider ? 'border-t border-neutral-800' : '',
                ].join(' ')}
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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DateFilter>(DEFAULT_DATE_FILTER)

  useEffect(() => {
    fetchSalesLeads().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

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
        <KpiCard title="예상 입금 합" value={`₩${fmtKrw(monthly.grand.total)}`} subtitle={`전망 ${monthly.forecastN}건`} />
        <KpiCard title="정체 위험" value={atRisk} subtitle="협상·스톨 14일+ 무대응" />
      </div>

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
            <SectionTable rows={secRows} />
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
