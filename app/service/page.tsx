import type { Metadata } from 'next'
import ServiceContent from '@/components/service-content'
import { safeJsonLdStringify } from '@/lib/json-ld'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '서비스 소개 | 크로스보더 인플루언서 마케팅 & 시딩',
  description:
    '크로스보더 인플루언서 마케팅, 대량 시딩, 콘텐츠 제작, 데이터 리포팅까지. 300+ 전속 크리에이터, 5,000+ 체험단 풀. 코리너스의 크로스보더 마케팅 서비스를 확인하세요.',
  alternates: { canonical: `${siteUrl}/service` },
  openGraph: {
    title: '코리너스 서비스 | 크로스보더 인플루언서 마케팅 에이전시',
    description: '인플루언서 캠페인, 대량 시딩, 콘텐츠 제작, 데이터 리포팅. 300+ 전속 크리에이터 네트워크.',
    url: `${siteUrl}/service`,
  },
}

export default function ServicePage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '서비스' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumb) }}
      />
      <ServiceContent />
    </>
  )
}
