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
