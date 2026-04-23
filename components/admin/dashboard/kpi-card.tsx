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
        'rounded-lg border bg-card p-3 sm:p-4 transition-colors flex flex-col justify-between h-full min-h-[96px]',
        href ? 'cursor-pointer hover:bg-neutral-800 hover:border-neutral-700' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight break-keep">{title}</p>
      <p className="mt-1.5 text-base sm:text-lg lg:text-xl font-bold whitespace-nowrap tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground min-h-[0.85rem] leading-tight break-keep">{subtitle ?? ' '}</p>
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }

  return inner
}
