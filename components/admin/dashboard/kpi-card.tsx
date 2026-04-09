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
        'rounded-lg border bg-card p-4 sm:p-6 transition-colors flex flex-col justify-between h-full min-h-[100px]',
        href ? 'cursor-pointer hover:bg-neutral-800 hover:border-neutral-700' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-lg sm:text-2xl font-bold whitespace-nowrap tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground min-h-[1rem]">{subtitle ?? '\u00A0'}</p>
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }

  return inner
}
