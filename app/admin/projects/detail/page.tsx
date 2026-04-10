'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpDown } from 'lucide-react'
import { fetchAllProjects, fetchExchangeRates } from '@/lib/dashboard/queries'
import {
  totalContractKrw,
  totalExpenseKrw,
  totalMarginKrw,
  marginRate,
  receivableKrw,
  FALLBACK_RATES,
  type Project,
  type ExchangeRates,
} from '@/lib/dashboard/calculations'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const NON_ACTIVE_STATUSES = new Set(['진행 완료', '진행 전', '보류'])

const fmtKrw = (n: number) => `₩${Math.round(n).toLocaleString('ko-KR')}`
const fmtJpy = (n: number) => `¥${Math.round(n).toLocaleString('ja-JP')}`
const fmtDate = (d: string | null) => d ? d.slice(2).replace(/-/g, '.') : '—' // 26.01.15

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-neutral-800" />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Shared table header with sort
// ─────────────────────────────────────────────
type SortDir = 'asc' | 'desc' | null

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string
  field: string
  sortField: string | null
  sortDir: SortDir
  onSort: (field: string) => void
}) {
  const active = sortField === field
  return (
    <th
      className="cursor-pointer select-none px-3 py-2.5 text-left text-xs font-medium text-neutral-400 hover:text-neutral-200 whitespace-nowrap"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={['h-3 w-3 transition-colors', active ? 'text-orange-500' : 'text-neutral-600'].join(' ')}
        />
      </span>
    </th>
  )
}

// ─────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-neutral-600">—</span>

  const colorMap: Record<string, string> = {
    '진행 완료': 'bg-emerald-900/40 text-emerald-400',
    '진행 전': 'bg-neutral-800 text-neutral-400',
    '보류': 'bg-yellow-900/40 text-yellow-400',
    '리스트업': 'bg-sky-900/40 text-sky-400',
    '섭외 중': 'bg-indigo-900/40 text-indigo-400',
    '검토 중': 'bg-purple-900/40 text-purple-400',
    '진행 중': 'bg-blue-900/40 text-blue-400',
    '클라이언트 정산 중': 'bg-orange-900/40 text-orange-400',
    '인플루언서 정산 중': 'bg-orange-900/40 text-orange-400',
  }

  const cls = colorMap[status] ?? 'bg-neutral-800 text-neutral-300'
  return (
    <span className={['inline-block rounded px-1.5 py-0.5 text-xs font-medium', cls].join(' ')}>
      {status}
    </span>
  )
}

// ─────────────────────────────────────────────
// view=total — 전체 프로젝트
// ─────────────────────────────────────────────
function TotalView({ projects, rates }: { projects: Project[]; rates: ExchangeRates }) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
        if (sortDir === 'desc') setSortField(null)
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField, sortDir]
  )

  const sorted = [...projects].sort((a, b) => {
    if (!sortField || !sortDir) return 0
    if (sortField === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    if (sortField === 'brand') {
      return sortDir === 'asc'
        ? (a.company_name ?? '').localeCompare(b.company_name ?? '')
        : (b.company_name ?? '').localeCompare(a.company_name ?? '')
    }
    if (sortField === 'contract') {
      return sortDir === 'asc'
        ? totalContractKrw(a, rates) - totalContractKrw(b, rates)
        : totalContractKrw(b, rates) - totalContractKrw(a, rates)
    }
    if (sortField === 'status') {
      return sortDir === 'asc'
        ? (a.status ?? '').localeCompare(b.status ?? '')
        : (b.status ?? '').localeCompare(a.status ?? '')
    }
    if (sortField === 'startDate') {
      return sortDir === 'asc'
        ? (a.start_date ?? '').localeCompare(b.start_date ?? '')
        : (b.start_date ?? '').localeCompare(a.start_date ?? '')
    }
    return 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <SortableHeader label="법인명" field="brand" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="프로젝트명" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="상태" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400 whitespace-nowrap">담당자</th>
            <SortableHeader label="시작일" field="startDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="계약금액" field="contract" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/60 transition-colors">
              <td className="px-3 py-2.5 text-neutral-400 max-w-[120px] truncate">{p.company_name ?? '—'}</td>
              <td className="px-3 py-2.5 text-neutral-100 max-w-[200px] truncate">{p.name}</td>
              <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={p.status} /></td>
              <td className="px-3 py-2.5 text-neutral-400 text-xs max-w-[120px] truncate">
                {p.assignee_names.length > 0 ? p.assignee_names.join(', ') : '—'}
              </td>
              <td className="px-3 py-2.5 text-neutral-500 tabular-nums text-xs whitespace-nowrap">{fmtDate(p.start_date)}</td>
              <td className="px-3 py-2.5 text-right font-medium text-neutral-200 tabular-nums whitespace-nowrap">{fmtKrw(totalContractKrw(p, rates))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-right text-xs text-neutral-500">총 {projects.length}건</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// view=active — 진행 중
// ─────────────────────────────────────────────
function ActiveView({ projects, rates }: { projects: Project[]; rates: ExchangeRates }) {
  const active = projects.filter(
    (p) => p.status && !NON_ACTIVE_STATUSES.has(p.status)
  )
  const [sortField, setSortField] = useState<string | null>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
        if (sortDir === 'desc') setSortField(null)
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField, sortDir]
  )

  const sorted = [...active].sort((a, b) => {
    if (!sortField || !sortDir) return 0
    if (sortField === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    if (sortField === 'brand') {
      return sortDir === 'asc'
        ? (a.company_name ?? '').localeCompare(b.company_name ?? '')
        : (b.company_name ?? '').localeCompare(a.company_name ?? '')
    }
    if (sortField === 'contract') {
      return sortDir === 'asc'
        ? totalContractKrw(a, rates) - totalContractKrw(b, rates)
        : totalContractKrw(b, rates) - totalContractKrw(a, rates)
    }
    if (sortField === 'status') {
      return sortDir === 'asc'
        ? (a.status ?? '').localeCompare(b.status ?? '')
        : (b.status ?? '').localeCompare(a.status ?? '')
    }
    if (sortField === 'startDate') {
      return sortDir === 'asc'
        ? (a.start_date ?? '').localeCompare(b.start_date ?? '')
        : (b.start_date ?? '').localeCompare(a.start_date ?? '')
    }
    return 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <SortableHeader label="법인명" field="brand" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="프로젝트명" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="상태" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400 whitespace-nowrap">담당자</th>
            <SortableHeader label="시작일" field="startDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="계약금액" field="contract" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/60 transition-colors">
              <td className="px-3 py-2.5 text-neutral-400 max-w-[120px] truncate">{p.company_name ?? '—'}</td>
              <td className="px-3 py-2.5 text-neutral-100 max-w-[200px] truncate">{p.name}</td>
              <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={p.status} /></td>
              <td className="px-3 py-2.5 text-neutral-400 text-xs max-w-[120px] truncate">
                {p.assignee_names.length > 0 ? p.assignee_names.join(', ') : '—'}
              </td>
              <td className="px-3 py-2.5 text-neutral-500 tabular-nums text-xs whitespace-nowrap">{fmtDate(p.start_date)}</td>
              <td className="px-3 py-2.5 text-right font-medium text-neutral-200 tabular-nums whitespace-nowrap">{fmtKrw(totalContractKrw(p, rates))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-right text-xs text-neutral-500">진행 중 {active.length}건</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// view=contract — 총 계약금액
// ─────────────────────────────────────────────
function ContractView({ projects, rates }: { projects: Project[]; rates: ExchangeRates }) {
  const [sortField, setSortField] = useState<string | null>('contract')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
        if (sortDir === 'desc') setSortField(null)
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField, sortDir]
  )

  const sorted = [...projects].sort((a, b) => {
    if (!sortField || !sortDir) return 0
    if (sortField === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    if (sortField === 'brand') {
      return sortDir === 'asc'
        ? (a.company_name ?? '').localeCompare(b.company_name ?? '')
        : (b.company_name ?? '').localeCompare(a.company_name ?? '')
    }
    if (sortField === 'contract') {
      return sortDir === 'asc'
        ? totalContractKrw(a, rates) - totalContractKrw(b, rates)
        : totalContractKrw(b, rates) - totalContractKrw(a, rates)
    }
    if (sortField === 'status') {
      return sortDir === 'asc'
        ? (a.status ?? '').localeCompare(b.status ?? '')
        : (b.status ?? '').localeCompare(a.status ?? '')
    }
    if (sortField === 'startDate') {
      return sortDir === 'asc'
        ? (a.start_date ?? '').localeCompare(b.start_date ?? '')
        : (b.start_date ?? '').localeCompare(a.start_date ?? '')
    }
    return 0
  })

  const grandTotal = projects.reduce((acc, p) => acc + totalContractKrw(p, rates), 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <SortableHeader label="법인명" field="brand" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="프로젝트명" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="시작일" field="startDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400 whitespace-nowrap">계약(KRW)</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400 whitespace-nowrap">계약(JPY)</th>
            <SortableHeader label="합산(KRW)" field="contract" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/60 transition-colors">
              <td className="px-3 py-2.5 text-neutral-400 max-w-[120px] truncate">
                {p.company_name ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-neutral-100 max-w-[180px] truncate">{p.name}</td>
              <td className="px-3 py-2.5 text-neutral-500 whitespace-nowrap tabular-nums text-xs">
                {fmtDate(p.start_date)}
              </td>
              <td className="px-3 py-2.5 text-right text-neutral-300 whitespace-nowrap">
                {p.contract_krw > 0 ? fmtKrw(p.contract_krw) : '—'}
              </td>
              <td className="px-3 py-2.5 text-right text-neutral-300 whitespace-nowrap">
                {p.contract_jpy > 0 ? fmtJpy(p.contract_jpy) : '—'}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-neutral-100 whitespace-nowrap">
                {fmtKrw(totalContractKrw(p, rates))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-700">
            <td colSpan={5} className="px-3 py-3 text-right text-sm font-medium text-neutral-400">
              합계
            </td>
            <td className="px-3 py-3 text-right font-bold text-orange-400 whitespace-nowrap">
              {fmtKrw(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-1 text-right text-xs text-neutral-500">총 {projects.length}건 · 환율 ¥1=₩{rates.jpyToKrw} / $1=₩{rates.usdToKrw}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// view=receivable — 미수금
// ─────────────────────────────────────────────
function ReceivableView({ projects, rates }: { projects: Project[]; rates: ExchangeRates }) {
  const withReceivable = projects
    .map((p) => ({ p, recv: receivableKrw(p, rates) }))
    .filter(({ recv }) => recv > 0)
    .sort((a, b) => b.recv - a.recv)

  const grandTotal = withReceivable.reduce((acc, { recv }) => acc + recv, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400">법인명</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400">프로젝트명</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400 whitespace-nowrap">시작일</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400 whitespace-nowrap">계약금액</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400 whitespace-nowrap">입금상태</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400 whitespace-nowrap">미수금</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400 whitespace-nowrap">정산상태</th>
          </tr>
        </thead>
        <tbody>
          {withReceivable.map(({ p, recv }) => (
            <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/60 transition-colors">
              <td className="px-3 py-2.5 text-neutral-400 max-w-[120px] truncate">
                {p.company_name ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-neutral-100 max-w-[180px] truncate">{p.name}</td>
              <td className="px-3 py-2.5 text-neutral-500 whitespace-nowrap tabular-nums text-xs">
                {fmtDate(p.start_date)}
              </td>
              <td className="px-3 py-2.5 text-right text-neutral-300 whitespace-nowrap">
                {fmtKrw(totalContractKrw(p, rates))}
              </td>
              <td className="px-3 py-2.5 text-neutral-400 whitespace-nowrap">
                {p.payment_status || '—'}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-orange-400 whitespace-nowrap">
                {fmtKrw(recv)}
              </td>
              <td className="px-3 py-2.5">
                {p.payment_status ? (
                  <span className="text-xs text-neutral-300">{p.payment_status}</span>
                ) : (
                  <span className="text-xs text-neutral-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-700">
            <td colSpan={5} className="px-3 py-3 text-right text-sm font-medium text-neutral-400">
              미수금 합계
            </td>
            <td className="px-3 py-3 text-right font-bold text-orange-400 whitespace-nowrap">
              {fmtKrw(grandTotal)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
      <p className="mt-1 text-right text-xs text-neutral-500">
        미수금 {withReceivable.length}건 · 환율 ¥1=₩{rates.jpyToKrw} / $1=₩{rates.usdToKrw}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// view=margin — 프로젝트별 마진
// ─────────────────────────────────────────────
function MarginView({ projects, rates }: { projects: Project[]; rates: ExchangeRates }) {
  const filtered = projects
    .filter((p) => totalContractKrw(p, rates) > 0 || totalExpenseKrw(p, rates) > 0)
  const [sortField, setSortField] = useState<string | null>('margin')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
        if (sortDir === 'desc') setSortField(null)
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField, sortDir]
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField || !sortDir) return 0
    if (sortField === 'brand') {
      return sortDir === 'asc'
        ? (a.company_name ?? '').localeCompare(b.company_name ?? '')
        : (b.company_name ?? '').localeCompare(a.company_name ?? '')
    }
    if (sortField === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    }
    if (sortField === 'startDate') {
      return sortDir === 'asc'
        ? (a.start_date ?? '').localeCompare(b.start_date ?? '')
        : (b.start_date ?? '').localeCompare(a.start_date ?? '')
    }
    if (sortField === 'contract') {
      return sortDir === 'asc'
        ? totalContractKrw(a, rates) - totalContractKrw(b, rates)
        : totalContractKrw(b, rates) - totalContractKrw(a, rates)
    }
    if (sortField === 'creator') {
      return sortDir === 'asc'
        ? totalExpenseKrw(a, rates) - totalExpenseKrw(b, rates)
        : totalExpenseKrw(b, rates) - totalExpenseKrw(a, rates)
    }
    if (sortField === 'margin') {
      return sortDir === 'asc'
        ? totalMarginKrw(a, rates) - totalMarginKrw(b, rates)
        : totalMarginKrw(b, rates) - totalMarginKrw(a, rates)
    }
    if (sortField === 'marginRate') {
      return sortDir === 'asc'
        ? marginRate(a, rates) - marginRate(b, rates)
        : marginRate(b, rates) - marginRate(a, rates)
    }
    return 0
  })

  const totalContract = filtered.reduce((acc, p) => acc + totalContractKrw(p, rates), 0)
  const totalExpense = filtered.reduce((acc, p) => acc + totalExpenseKrw(p, rates), 0)
  const totalMarginAmt = filtered.reduce((acc, p) => acc + totalMarginKrw(p, rates), 0)
  const avgMarginPct = filtered.length > 0
    ? filtered.reduce((acc, p) => acc + marginRate(p, rates), 0) / filtered.length
    : 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <SortableHeader label="법인명" field="brand" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="프로젝트명" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="시작일" field="startDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="계약금액" field="contract" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="지출액(섭외비)" field="creator" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="마진" field="margin" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="마진율" field="marginRate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const m = totalMarginKrw(p, rates)
            const mr = marginRate(p, rates)
            return (
              <tr key={p.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/60 transition-colors">
                <td className="px-3 py-2.5 text-neutral-400 max-w-[120px] truncate">{p.company_name ?? '—'}</td>
                <td className="px-3 py-2.5 text-neutral-100 max-w-[180px] truncate">{p.name}</td>
                <td className="px-3 py-2.5 text-neutral-500 whitespace-nowrap tabular-nums text-xs">{fmtDate(p.start_date)}</td>
                <td className="px-3 py-2.5 text-right text-neutral-300 whitespace-nowrap">{fmtKrw(totalContractKrw(p, rates))}</td>
                <td className="px-3 py-2.5 text-right text-neutral-400 whitespace-nowrap">{fmtKrw(totalExpenseKrw(p, rates))}</td>
                <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${m < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {fmtKrw(m)}
                </td>
                <td className={`px-3 py-2.5 text-right whitespace-nowrap tabular-nums ${mr < 0 ? 'text-red-400' : mr < 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {mr.toFixed(1)}%
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-700">
            <td colSpan={3} className="px-3 py-3 text-right text-sm font-medium text-neutral-400">합계 / 평균</td>
            <td className="px-3 py-3 text-right text-neutral-300 whitespace-nowrap">{fmtKrw(totalContract)}</td>
            <td className="px-3 py-3 text-right text-neutral-400 whitespace-nowrap">{fmtKrw(totalExpense)}</td>
            <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${totalMarginAmt < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {fmtKrw(totalMarginAmt)}
            </td>
            <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${avgMarginPct < 0 ? 'text-red-400' : avgMarginPct < 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {avgMarginPct.toFixed(1)}%
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-1 text-right text-xs text-neutral-500">{filtered.length}건 · 환율 ¥1=₩{rates.jpyToKrw} / $1=₩{rates.usdToKrw}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page config map
// ─────────────────────────────────────────────
type ViewType = 'total' | 'active' | 'contract' | 'receivable' | 'margin'

const VIEW_CONFIG: Record<ViewType, { title: string; description: string }> = {
  total: { title: '총 프로젝트', description: '전체 프로젝트 목록입니다.' },
  active: { title: '진행 중 프로젝트', description: '현재 진행 중인 프로젝트 목록입니다.' },
  contract: { title: '총 계약금액', description: '계약금액 기준 전체 프로젝트 내역입니다.' },
  receivable: { title: '미수금 현황', description: '미수금이 남아 있는 프로젝트 목록입니다.' },
  margin: { title: '마진 분석', description: '프로젝트별 마진(계약금액 - 지출액) 분석입니다.' },
}

// ─────────────────────────────────────────────
// Inner content (uses useSearchParams)
// ─────────────────────────────────────────────
function DetailContent() {
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view') as ViewType | null
  const view: ViewType = viewParam && viewParam in VIEW_CONFIG ? viewParam : 'total'

  const [projects, setProjects] = useState<Project[]>([])
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [all, r] = await Promise.all([fetchAllProjects(), fetchExchangeRates()])
      setProjects(all)
      setRates(r)
      setLoading(false)
    }
    load()
  }, [])

  const config = VIEW_CONFIG[view]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/admin" className="hover:text-neutral-300 transition-colors">
          어드민
        </Link>
        <span>/</span>
        <Link href="/admin/projects" className="hover:text-neutral-300 transition-colors">
          프로젝트 현황
        </Link>
        <span>/</span>
        <span className="text-neutral-300">{config.title}</span>
      </div>

      {/* Back link */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        대시보드
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-neutral-50">{config.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{config.description}</p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        {loading ? (
          <TableSkeleton />
        ) : (
          <>
            {view === 'total' && <TotalView projects={projects} rates={rates} />}
            {view === 'active' && <ActiveView projects={projects} rates={rates} />}
            {view === 'contract' && <ContractView projects={projects} rates={rates} />}
            {view === 'receivable' && <ReceivableView projects={projects} rates={rates} />}
            {view === 'margin' && <MarginView projects={projects} rates={rates} />}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page export (Suspense boundary for useSearchParams)
// ─────────────────────────────────────────────
export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-4 w-48 animate-pulse rounded bg-neutral-800" />
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-800" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-neutral-800" />
            ))}
          </div>
        </div>
      }
    >
      <DetailContent />
    </Suspense>
  )
}
