import type { Metadata } from 'next'
import { PortfoliosListPage } from '@/components/admin/portfolios-list-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '포트폴리오',
}

export default function AdminPortfoliosPage() {
  return <PortfoliosListPage />
}
