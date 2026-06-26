'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Label,
} from 'recharts'

const COLORS = ['#FF4500', '#141414', '#666666', '#999999', '#CCCCCC', '#FF6B35']

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8 },
  labelStyle: { color: '#fff', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: '#ccc' },
}

// ────────────────────────────────────────────────────────────
// StatusBarChart — 가로 바차트, 상태별 프로젝트 수
// ────────────────────────────────────────────────────────────
interface StatusBarChartProps {
  data: { status: string; count: number }[]
}

function StatusBarLabel({ x, y, width, value }: { x?: number; y?: number; width?: number; value?: number }) {
  if (!value) return null
  return (
    <text x={(x ?? 0) + (width ?? 0) + 6} y={(y ?? 0) + 14} fontSize={12} fill="#ccc">
      {value}
    </text>
  )
}

export function StatusBarChart({ data }: StatusBarChartProps) {
  const chartHeight = Math.max(200, data.length * 36 + 40)
  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} hide />
        <YAxis type="category" dataKey="status" width={120} tick={{ fontSize: 12 }} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => [`${value}개`, '프로젝트']} />
        <Bar dataKey="count" fill={COLORS[0]} radius={[0, 4, 4, 0]} label={<StatusBarLabel />} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────────────────────────────────────────
// TeamDonutChart — 도넛 차트, 팀별 프로젝트 비율
// ────────────────────────────────────────────────────────────
interface TeamDonutChartProps {
  data: { team: string; count: number }[]
}

export function TeamDonutChart({ data }: TeamDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="team"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          label={({ team, percent }) =>
            `${team} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}개`, '프로젝트']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────────────────────────────────────────
// MonthlyBarChart — 바 차트, 월별 계약 금액 (₩ 포맷)
// ────────────────────────────────────────────────────────────
interface MonthlyBarChartProps {
  data: { month: string; amount: number }[]
}

const krwFormatter = (value: number) =>
  `₩${(value / 10000).toFixed(0)}만`

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 16, right: 24, top: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }}>
          <Label value="월" offset={-8} position="insideBottom" style={{ fontSize: 11, fill: '#888' }} />
        </XAxis>
        <YAxis tickFormatter={krwFormatter} tick={{ fontSize: 12 }}>
          <Label value="금액(만원)" angle={-90} position="insideLeft" offset={8} style={{ fontSize: 11, fill: '#888' }} />
        </YAxis>
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(label: string) => `${label}월`}
          formatter={(value: number) => [
            `₩${value.toLocaleString('ko-KR')}`,
            '계약 금액',
          ]}
        />
        <Bar dataKey="amount" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────────────────────────────────────────
// TrendLineChart — 라인 차트, 2라인 (신규 + 완료)
// ────────────────────────────────────────────────────────────
interface TrendLineChartProps {
  data: { month: string; new: number; completed: number }[]
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(label: string) => `${label}월`} />
        <Legend />
        <Line
          type="monotone"
          dataKey="new"
          name="신규"
          stroke={COLORS[0]}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="completed"
          name="완료"
          stroke={COLORS[1]}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────────────────────────────────────────
// MonthlyFlowChart — 월별 흐름: 신규 인입 vs 체결 (이벤트 기반, 재고 아님)
// 재고 스냅샷 추세를 대체. 일별 잡음·체결 역행 노이즈 없음.
// ────────────────────────────────────────────────────────────
interface MonthlyFlowPoint {
  label: string // 'M월'
  intake: number
  contracted: number
  incomplete?: boolean // 데이터 미완 월(흐리게 표시)
}

export function MonthlyFlowChart({ data }: { data: MonthlyFlowPoint[] }) {
  // 미완 월은 저투명도로 흐리게(블러 대용) + 라벨 흐림.
  const op = (d: MonthlyFlowPoint) => (d.incomplete ? 0.25 : 1)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="label"
          height={38}
          tick={({ x, y, payload, index }: { x: number; y: number; payload: { value: string }; index: number }) => {
            const inc = data[index]?.incomplete
            return (
              <g>
                <text x={x} y={y + 12} textAnchor="middle" fontSize={12} fill={inc ? '#555' : '#888'}>
                  {payload.value}
                </text>
                {inc && (
                  <text x={x} y={y + 25} textAnchor="middle" fontSize={9} fill="#555">
                    미완
                  </text>
                )}
              </g>
            )
          }}
        />
        <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11, fill: '#888' }} />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value: number, name: string) => [`${value}건`, name === 'intake' ? '신규 인입' : '체결']}
          labelFormatter={(label: string, p) =>
            p?.[0]?.payload?.incomplete ? `${label} (데이터 미완)` : label
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => (v === 'intake' ? '신규 인입' : '체결')} />
        <Bar dataKey="intake" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill="#fbbf24" fillOpacity={op(d)} />
          ))}
        </Bar>
        <Bar dataKey="contracted" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill="#34d399" fillOpacity={op(d)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────────────────────────────────────────
// WorkloadBarChart — 세로 스택 바차트, 담당자별 상태 분류
// ────────────────────────────────────────────────────────────
interface WorkloadBarChartProps {
  data: { assignee: string; active: number; completed: number; other: number; total: number }[]
}

function WorkloadTopLabel({ x, y, width, value }: { x?: number; y?: number; width?: number; value?: number }) {
  if (!value) return null
  return (
    <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 6} fontSize={12} fill="#ccc" textAnchor="middle">
      {value}
    </text>
  )
}

const STACK_COLORS = { active: '#FF4500', completed: '#22c55e', other: '#666666' }

export function WorkloadBarChart({ data }: WorkloadBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 8, right: 24, top: 24, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="assignee" tick={{ fontSize: 11 }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} hide />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value: number, name: string) => {
            const label = name === 'active' ? '진행중' : name === 'completed' ? '완료' : '기타'
            return [`${value}개`, label]
          }}
        />
        <Legend
          formatter={(value: string) =>
            value === 'active' ? '진행중' : value === 'completed' ? '완료' : '기타'
          }
        />
        <Bar dataKey="active" stackId="a" fill={STACK_COLORS.active} />
        <Bar dataKey="completed" stackId="a" fill={STACK_COLORS.completed} />
        <Bar dataKey="other" stackId="a" fill={STACK_COLORS.other} radius={[4, 4, 0, 0]} label={<WorkloadTopLabel />} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ────────────────────────────────────────────────────────────
// MonthlyFunnelChart — 월별 퍼널 stacked bar (인입 또는 체결)
// 월간통계(Obsidian) 퍼널 분해 화면을 어드민으로 포팅. 색/순서 동일.
// NOTE: 축/그리드/툴팁 스타일이 MonthlyFlowChart 와 비슷하나, 그쪽은 intake-vs-contracted
// 2-시리즈, 이쪽은 funnel N-스택으로 시리즈 구성이 달라 공유 컴포넌트로 추출하지 않음(의도).
// ────────────────────────────────────────────────────────────
interface MonthlyFunnelChartProps {
  data: Record<string, number | string>[]
  funnels: string[] // 스택 순서 (아래→위)
  colorOf: (funnel: string) => string
  unit?: string // 툴팁 단위 (기본 '건')
}

// gap-fill 로 빈 달의 모든 퍼널이 0 으로 채워져 기본 툴팁이 "…0건"을 줄줄이 나열 →
// 값 0 인 퍼널은 숨겨 활성 퍼널만 보이게 하는 커스텀 툴팁.
function FunnelStackTooltip({
  active, payload, label, unit,
}: {
  active?: boolean
  label?: string
  unit: string
  payload?: { name?: string; value?: number; color?: string; dataKey?: string | number }[]
}) {
  if (!active || !payload?.length) return null
  const items = payload.filter((p) => (p.value ?? 0) > 0)
  if (!items.length) return null
  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <div style={TOOLTIP_STYLE.labelStyle}>{label}</div>
      {items.map((p) => (
        <div key={String(p.dataKey)} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: {p.value}
          {unit}
        </div>
      ))}
    </div>
  )
}

export function MonthlyFunnelChart({ data, funnels, colorOf, unit = '건' }: MonthlyFunnelChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis dataKey="label" height={28} tick={{ fontSize: 12, fill: '#888' }} />
        <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11, fill: '#888' }} />
        <Tooltip content={<FunnelStackTooltip unit={unit} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {funnels.map((f, i) => (
          <Bar
            key={f}
            dataKey={f}
            stackId="a"
            fill={colorOf(f)}
            isAnimationActive={false}
            radius={i === funnels.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
