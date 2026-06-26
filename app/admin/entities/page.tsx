'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight } from 'lucide-react'
import { fetchEntitySummary, fetchEntityDeals, type EntitySummary, type UnifiedDeal } from '@/lib/dashboard/entities'
import { fmtKrw } from '@/lib/dashboard/sales'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'

export const dynamic = 'force-dynamic'

type SortKey = 'name' | 'deals' | 'krw' | 'jpy' | 'agency' | 'leads' | 'last'
type SortState = { key: SortKey; dir: 'asc' | 'desc' }

const GET: Record<SortKey, (e: EntitySummary) => number | string> = {
  name: (e) => e.canonical_name,
  deals: (e) => e.deal_count,
  krw: (e) => e.total_krw,
  jpy: (e) => e.total_jpy,
  agency: (e) => e.agency_count,
  leads: (e) => e.lead_count,
  last: (e) => e.last_deal ?? '',
}

const COLUMNS: { label: string; key?: SortKey; align?: 'right' }[] = [
  { label: '브랜드', key: 'name' },
  { label: '유형' },
  { label: '업종' },
  { label: '계약수', key: 'deals', align: 'right' },
  { label: '누적 매출(원)', key: 'krw', align: 'right' },
  { label: '누적(엔)', key: 'jpy', align: 'right' },
  { label: '대행사', key: 'agency', align: 'right' },
  { label: '리드', key: 'leads', align: 'right' },
  { label: '최근 계약', key: 'last' },
]

function DealRows({ entityId }: { entityId: string }) {
  const [deals, setDeals] = useState<UnifiedDeal[] | null>(null)
  useEffect(() => {
    fetchEntityDeals(entityId).then(setDeals)
  }, [entityId])
  if (deals === null) return <div className="px-6 py-2 text-xs text-neutral-500">불러오는 중…</div>
  if (deals.length === 0) return <div className="px-6 py-2 text-xs text-neutral-600">연결된 계약 없음 (리드/캠페인만)</div>
  return (
    <div className="space-y-1 px-6 py-2">
      {deals.map((d, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="font-mono text-neutral-400">{d.unique_code}</span>
          <span className="text-neutral-500">{d.deal_agency}</span>
          <span className="text-amber-300/80">
            {d.currency === 'JPY' ? `¥${(d.total_jpy ?? 0).toLocaleString()}` : `₩${fmtKrw(d.total_krw ?? 0)}`}
          </span>
          <span className="text-neutral-500">{d.contract_date ?? ''}</span>
          {d.ops_status && <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">{d.ops_status}</span>}
        </div>
      ))}
    </div>
  )
}

export default function EntitiesPage() {
  const [rows, setRows] = useState<EntitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'brand' | 'agency'>('brand')
  const [sort, setSort] = useState<SortState>({ key: 'krw', dir: 'desc' })
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchEntitySummary().then((r) => {
      setRows(r)
      setLoading(false)
    })
  }, [])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let r = rows
    if (typeFilter !== 'all') r = r.filter((e) => e.entity_type === typeFilter)
    if (needle) r = r.filter((e) => e.canonical_name.toLowerCase().includes(needle))
    const get = GET[sort.key]
    const mul = sort.dir === 'asc' ? 1 : -1
    return [...r].sort((a, b) => {
      const va = get(a), vb = get(b)
      const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ko')
      return c * mul
    })
  }, [rows, q, typeFilter, sort])

  const kpi = useMemo(() => {
    const brands = rows.filter((e) => e.entity_type === 'brand')
    return {
      brands: brands.length,
      agencies: rows.filter((e) => e.entity_type === 'agency').length,
      deals: rows.reduce((s, e) => s + e.deal_count, 0),
      krw: rows.reduce((s, e) => s + e.total_krw, 0),
    }
  }, [rows])

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
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300">
          <ArrowLeft className="h-3.5 w-3.5" />
          어드민
        </Link>
        <h1 className="text-lg font-semibold text-neutral-50">통합 엔티티</h1>
        <span className="text-[11px] text-neutral-600">브랜드 단위 BD 통합 (계약·운영·리드)</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard title="브랜드" value={kpi.brands} subtitle="정규 브랜드 엔티티" />
        <KpiCard title="대행사" value={kpi.agencies} subtitle="브랜드 아님(집계 제외)" />
        <KpiCard title="총 계약" value={kpi.deals} subtitle="전 브랜드 누적" />
        <KpiCard title="누적 매출" value={`₩${fmtKrw(kpi.krw)}`} subtitle="계약 기준" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="브랜드 검색"
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
        />
        <div className="flex gap-1">
          {(['brand', 'agency', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={[
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                typeFilter === t ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300',
              ].join(' ')}
            >
              {t === 'brand' ? '브랜드' : t === 'agency' ? '대행사' : '전체'}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-600">{filtered.length}개</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/50 text-left text-xs text-neutral-400">
              <th className="w-6" />
              {COLUMNS.map((c) => (
                <th
                  key={c.label}
                  className={['px-3 py-2 font-medium', c.align === 'right' ? 'text-right' : '', c.key ? 'cursor-pointer select-none hover:text-neutral-200' : ''].join(' ')}
                  onClick={c.key ? () => toggleSort(c.key as SortKey) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.key && (sort.key === c.key ? (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <Fragment key={e.entity_id}>
                <tr
                  className="border-b border-neutral-900 hover:bg-neutral-900/40 cursor-pointer"
                  onClick={() => setOpen((o) => (o === e.entity_id ? null : e.entity_id))}
                >
                  <td className="pl-2 text-neutral-600">
                    <ChevronRight className={['h-3.5 w-3.5 transition-transform', open === e.entity_id ? 'rotate-90' : ''].join(' ')} />
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-100 break-keep">{e.canonical_name}</td>
                  <td className="px-3 py-2">
                    <span className={['rounded px-1.5 py-0.5 text-[10px] font-semibold', e.entity_type === 'agency' ? 'bg-neutral-800 text-neutral-400' : 'bg-violet-500/15 text-violet-300'].join(' ')}>
                      {e.entity_type === 'agency' ? '대행사' : '브랜드'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">{e.industry ?? ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-300">{e.deal_count || ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber-300/90">{e.total_krw ? fmtKrw(e.total_krw) : ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-400">{e.total_jpy ? `¥${e.total_jpy.toLocaleString()}` : ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{e.agency_count || ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{e.lead_count || ''}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">{e.last_deal ?? ''}</td>
                </tr>
                {open === e.entity_id && (
                  <tr className="bg-neutral-950/60">
                    <td colSpan={COLUMNS.length + 1}>
                      <DealRows entityId={e.entity_id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-neutral-500">
        브랜드 단위 정규 엔티티(유니크코드=딜키). 같은 브랜드의 반복·다대행 계약이 한 줄로 집계됩니다. 매출은 Contract DB 기준,
        대행사 유형은 매출 집계에서 제외. 행 클릭 시 딜 명세(계약·운영) 펼침. 데이터는 entity_id 트리거로 동기화마다 자동 갱신.
      </p>
    </div>
  )
}
