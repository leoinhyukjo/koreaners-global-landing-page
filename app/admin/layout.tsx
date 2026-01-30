import type { Metadata } from 'next'
import { AdminLayoutClient } from './layout-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    template: '어드민 | %s',
    default: '어드민',
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
