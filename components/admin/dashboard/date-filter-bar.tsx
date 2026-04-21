'use client'

import { useMemo } from 'react'

export type DatePreset =
  | 'all'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom'

export interface DateFilter {
  preset: DatePreset
  /** ISO 'YYYY-MM-DD'. Only used when preset === 'custom'. */
  customFrom?: string
  /** ISO 'YYYY-MM-DD'. Only used when preset === 'custom'. */
  customTo?: string
}

export const DEFAULT_DATE_FILTER: DateFilter = { preset: 'all' }

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'this_month', label: '이번 달' },
  { key: 'last_month', label: '지난 달' },
  { key: 'this_quarter', label: '이번 분기' },
  { key: 'last_quarter', label: '지난 분기' },
  { key: 'this_year', label: '올해' },
  { key: 'last_year', label: '작년' },
  { key: 'custom', label: '사용자 지정' },
]

function toISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Returns `{from, to}` ISO strings (inclusive). `null` = no bound. */
export function computeDateRange(
  filter: DateFilter,
  now: Date = new Date()
): { from: string | null; to: string | null } {
  const y = now.getFullYear()
  const m = now.getMonth() // 0-11
  const quarter = Math.floor(m / 3) // 0-3

  switch (filter.preset) {
    case 'all':
      return { from: null, to: null }
    case 'this_month':
      return {
        from: toISO(new Date(y, m, 1)),
        to: toISO(new Date(y, m + 1, 0)),
      }
    case 'last_month':
      return {
        from: toISO(new Date(y, m - 1, 1)),
        to: toISO(new Date(y, m, 0)),
      }
    case 'this_quarter': {
      const qStart = quarter * 3
      return {
        from: toISO(new Date(y, qStart, 1)),
        to: toISO(new Date(y, qStart + 3, 0)),
      }
    }
    case 'last_quarter': {
      const qStart = quarter * 3 - 3
      return {
        from: toISO(new Date(y, qStart, 1)),
        to: toISO(new Date(y, qStart + 3, 0)),
      }
    }
    case 'this_year':
      return {
        from: toISO(new Date(y, 0, 1)),
        to: toISO(new Date(y, 11, 31)),
      }
    case 'last_year':
      return {
        from: toISO(new Date(y - 1, 0, 1)),
        to: toISO(new Date(y - 1, 11, 31)),
      }
    case 'custom':
      return {
        from: filter.customFrom || null,
        to: filter.customTo || null,
      }
  }
}

/**
 * Overlap rule: project 포함 조건 = `start_date ≤ to AND end_date ≥ from`.
 * null start_date → -∞ / null end_date → +∞ (현재 진행 중으로 간주).
 * 둘 다 null 인 row 는 필터 활성 시 제외.
 */
export function matchesDateRange(
  p: { start_date: string | null; end_date: string | null },
  range: { from: string | null; to: string | null }
): boolean {
  if (range.from === null && range.to === null) return true
  if (!p.start_date && !p.end_date) return false

  const effStart = p.start_date ?? '0000-01-01'
  const effEnd = p.end_date ?? '9999-12-31'

  if (range.to !== null && effStart > range.to) return false
  if (range.from !== null && effEnd < range.from) return false
  return true
}

interface Props {
  value: DateFilter
  onChange: (v: DateFilter) => void
  /** 필터 적용 전/후 카운트 표시용. optional. */
  totalCount?: number
  filteredCount?: number
}

export function DateFilterBar({ value, onChange, totalCount, filteredCount }: Props) {
  const range = useMemo(() => computeDateRange(value), [value])
  const isCustom = value.preset === 'custom'

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => {
          const active = value.preset === p.key
          return (
            <button
              key={p.key}
              onClick={() => onChange({ preset: p.key, customFrom: value.customFrom, customTo: value.customTo })}
              className={[
                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-orange-500/60 bg-orange-500/10 text-orange-400'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200',
              ].join(' ')}
            >
              {p.label}
            </button>
          )
        })}

        {isCustom && (
          <div className="ml-1 flex items-center gap-1.5">
            <input
              type="date"
              value={value.customFrom ?? ''}
              onChange={(e) => onChange({ ...value, customFrom: e.target.value || undefined })}
              className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 focus:border-orange-500/60 focus:outline-none"
            />
            <span className="text-xs text-neutral-500">~</span>
            <input
              type="date"
              value={value.customTo ?? ''}
              onChange={(e) => onChange({ ...value, customTo: e.target.value || undefined })}
              className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 focus:border-orange-500/60 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span className="tabular-nums">
          {range.from || range.to
            ? `${range.from ?? '…'} ~ ${range.to ?? '…'}`
            : '기간 제한 없음'}
        </span>
        {typeof totalCount === 'number' && typeof filteredCount === 'number' && (
          <span className="tabular-nums">
            {filteredCount === totalCount
              ? `${totalCount}건`
              : `${filteredCount} / ${totalCount}건`}
          </span>
        )}
      </div>
    </div>
  )
}
