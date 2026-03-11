import type { Metadata } from 'next'
import { AdminLayoutClient } from './layout-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '어드민',
  robots: { index: false, follow: false },
}

/**
 * Admin Layout
 * 인증은 middleware.ts에서 처리 (리다이렉트 루프 방지)
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
