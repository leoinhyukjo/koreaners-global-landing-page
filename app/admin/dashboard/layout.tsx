import Link from 'next/link'
import { DashboardTabs } from '@/components/admin/dashboard/dashboard-tabs'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-50">대시보드</h1>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 어드민
        </Link>
      </div>
      <DashboardTabs />
      {children}
    </div>
  )
}
