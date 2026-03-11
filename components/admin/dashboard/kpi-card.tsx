'use client'

import Link from 'next/link'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  href?: string
}

export function KpiCard({ title, value, subtitle, href }: KpiCardProps) {
  const inner = (
    <div
      className={[
        'rounded-lg border bg-card p-6 transition-colors',
        href ? 'cursor-pointer hover:bg-neutral-800 hover:border-neutral-700' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }

  return inner
}
