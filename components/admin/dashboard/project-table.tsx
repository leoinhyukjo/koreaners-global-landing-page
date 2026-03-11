'use client'

import { type Project, totalContractKrw, receivableKrw } from '@/lib/dashboard/calculations'

// ────────────────────────────────────────────────────────────
// 우선순위 정렬 순서
// ────────────────────────────────────────────────────────────
const PRIORITY_ORDER: Record<string, number> = {
  '🔥TODAY': 0,
  '높음': 1,
  '보통': 2,
  '낮음': 3,
}

function priorityRank(p: string | null): number {
  if (!p) return 99
  return PRIORITY_ORDER[p] ?? 99
}

// ────────────────────────────────────────────────────────────
// 상태 뱃지 색상
// ────────────────────────────────────────────────────────────
const STATUS_COLORS: Map<string, string> = new Map([
  ['시작 전', 'bg-gray-100 text-gray-700'],
  ['보류', 'bg-pink-100 text-pink-700'],
  ['진행 중', 'bg-blue-100 text-blue-700'],
  ['검토 중', 'bg-purple-100 text-purple-700'],
  ['리스트업 중', 'bg-orange-100 text-orange-700'],
  ['리스트 전달', 'bg-orange-100 text-orange-700'],
  ['인플루언서 섭외', 'bg-green-100 text-green-700'],
  ['클라이언트 정산 중', 'bg-blue-100 text-blue-700'],
  ['인플루언서 정산 중', 'bg-blue-100 text-blue-700'],
  ['완료', 'bg-green-100 text-green-700'],
  ['Drop', 'bg-red-100 text-red-700'],
])

function statusBadgeClass(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-500'
  return STATUS_COLORS.get(status) ?? 'bg-gray-100 text-gray-600'
}

// ────────────────────────────────────────────────────────────
// 서류 뱃지 렌더
// ────────────────────────────────────────────────────────────
const DOC_DONE = new Set(['전달 완료', '계약 완료', '발행 완료'])
const DOC_SKIP = new Set(['스킵'])

function DocBadge({ value }: { value: string | null }) {
  if (!value || DOC_SKIP.has(value)) {
    return <span className="text-neutral-400">—</span>
  }
  if (DOC_DONE.has(value)) {
    return <span className="font-semibold text-green-600">✓</span>
  }
  return <span className="text-amber-500">…</span>
}

// ────────────────────────────────────────────────────────────
// KRW 포맷
// ────────────────────────────────────────────────────────────
function krw(amount: number): string {
  if (amount === 0) return '—'
  if (amount >= 10_000_000) return `${(amount / 10_000_000).toFixed(1)}천만`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}백만`
  if (amount >= 10_000) return `${(amount / 10_000).toFixed(0)}만`
  return amount.toLocaleString('ko-KR')
}

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface ProjectTableProps {
  projects: Project[]
  jpyRate: number
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
export function ProjectTable({ projects, jpyRate }: ProjectTableProps) {
  const sorted = [...projects].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  )

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-10 text-center text-sm text-neutral-500">
        프로젝트가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800 bg-neutral-900 text-left text-xs text-neutral-400">
            <th className="px-4 py-3 font-medium">프로젝트명</th>
            <th className="px-4 py-3 font-medium">브랜드</th>
            <th className="px-4 py-3 font-medium">상태</th>
            <th className="px-4 py-3 font-medium">우선순위</th>
            <th className="px-4 py-3 text-center font-medium">계약서</th>
            <th className="px-4 py-3 text-center font-medium">견적서</th>
            <th className="px-4 py-3 text-center font-medium">세금계산서</th>
            <th className="px-4 py-3 font-medium">정산상태</th>
            <th className="px-4 py-3 text-right font-medium">계약금액</th>
            <th className="px-4 py-3 text-right font-medium">미수금</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800 bg-neutral-950">
          {sorted.map((p) => {
            const contractAmt = totalContractKrw(p, jpyRate)
            const receivable = receivableKrw(p, jpyRate)

            return (
              <tr
                key={p.id}
                className="transition-colors hover:bg-neutral-900/60"
              >
                {/* 프로젝트명 */}
                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-100">
                  {p.name || '—'}
                </td>

                {/* 브랜드 */}
                <td className="px-4 py-3 text-neutral-400">
                  {p.brand_name || '—'}
                </td>

                {/* 상태 뱃지 */}
                <td className="px-4 py-3">
                  {p.status ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}
                    >
                      {p.status}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>

                {/* 우선순위 */}
                <td className="px-4 py-3">
                  {p.priority ? (
                    <span
                      className={`text-xs font-medium ${
                        p.priority === '🔥TODAY'
                          ? 'text-orange-400'
                          : p.priority === '높음'
                            ? 'text-red-400'
                            : p.priority === '보통'
                              ? 'text-neutral-300'
                              : 'text-neutral-500'
                      }`}
                    >
                      {p.priority}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>

                {/* 계약서 */}
                <td className="px-4 py-3 text-center">
                  <DocBadge value={p.contract_status} />
                </td>

                {/* 견적서 */}
                <td className="px-4 py-3 text-center">
                  <DocBadge value={p.estimate_status} />
                </td>

                {/* 세금계산서 */}
                <td className="px-4 py-3 text-center">
                  <DocBadge value={p.tax_invoice_status} />
                </td>

                {/* 정산상태 */}
                <td className="px-4 py-3">
                  {p.client_settlement ? (
                    <span
                      className={`text-xs ${
                        p.client_settlement === '입금 완료'
                          ? 'text-green-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {p.client_settlement}
                    </span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>

                {/* 계약금액 */}
                <td className="px-4 py-3 text-right font-mono text-neutral-300">
                  {contractAmt > 0 ? `₩${krw(contractAmt)}` : '—'}
                </td>

                {/* 미수금 */}
                <td
                  className={`px-4 py-3 text-right font-mono font-medium ${
                    receivable > 0 ? 'text-orange-400' : 'text-neutral-500'
                  }`}
                >
                  {receivable > 0 ? `₩${krw(receivable)}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
