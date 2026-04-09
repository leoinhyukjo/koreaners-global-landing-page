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
// MonthlyLineChart — 라인 차트, 월별 계약 금액 (₩ 포맷)
// ────────────────────────────────────────────────────────────
interface MonthlyLineChartProps {
  data: { month: string; amount: number }[]
}

const krwFormatter = (value: number) =>
  `₩${(value / 10000).toFixed(0)}만`

export function MonthlyLineChart({ data }: MonthlyLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ left: 16, right: 24, top: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" />
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
        <Line
          type="monotone"
          dataKey="amount"
          stroke={COLORS[0]}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
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
