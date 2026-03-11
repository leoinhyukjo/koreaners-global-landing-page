'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: '보고', href: '/admin/projects' },
  { label: '경영', href: '/admin/projects/report' },
]

export function DashboardTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-0 border-b border-neutral-800">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
