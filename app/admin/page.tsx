import type { Metadata } from 'next'
import { DashboardPage } from '@/components/admin/dashboard-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '대시보드',
}

export default function AdminDashboardPage() {
  return <DashboardPage />
}
