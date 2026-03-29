import type { Metadata } from 'next'
import CreatorPageContent from '@/components/creator-content'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '크리에이터 | 일본 전속 인플루언서 네트워크',
  description:
    '코리너스의 300+ 일본 전속 크리에이터를 만나보세요. 뷰티, 패션, F&B, 라이프스타일 등 다양한 카테고리의 검증된 인플루언서 네트워크.',
  alternates: { canonical: `${siteUrl}/creator` },
  openGraph: {
    title: '코리너스 크리에이터 | 일본 인플루언서 네트워크',
    description: '300+ 일본 전속 크리에이터. 뷰티, 패션, F&B 등 카테고리별 검증된 인플루언서.',
    url: `${siteUrl}/creator`,
  },
}

export default function CreatorPage() {
  return <CreatorPageContent />
}
