import type { Metadata } from 'next'
import { CreatorsListPage } from '@/components/admin/creators-list-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '크리에이터',
}

export default function AdminCreatorsPage() {
  return <CreatorsListPage />
}
