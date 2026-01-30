import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '어드민 | 문의 내역',
}

export default function InquiriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
