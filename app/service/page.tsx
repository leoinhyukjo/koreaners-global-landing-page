import type { Metadata } from 'next'
import ServiceContent from '@/components/service-content'
import { safeJsonLdStringify } from '@/lib/json-ld'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '서비스 소개 | 일본 인플루언서 마케팅 & 시딩 대행',
  description:
    '일본 인플루언서 마케팅, 대량 시딩, 콘텐츠 제작, 데이터 리포팅까지. 200+ 주요 크리에이터, 5,000+ 체험단 풀. 코리너스의 크로스보더 마케팅 서비스를 확인하세요.',
  alternates: { canonical: `${siteUrl}/service` },
  openGraph: {
    title: '코리너스 서비스 | 일본 인플루언서 마케팅 대행사',
    description: '일본 인플루언서 캠페인, 대량 시딩, 콘텐츠 제작, 데이터 리포팅. 200+ 주요 크리에이터 네트워크.',
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

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${siteUrl}/service#service`,
    name: '일본 크로스보더 인플루언서 마케팅',
    serviceType: '인플루언서 마케팅 / 대량 시딩 / 콘텐츠 제작 / 데이터 리포팅',
    description:
      '일본 인플루언서 마케팅, 대량 시딩, 콘텐츠 제작, 데이터 리포팅까지. 200+ 주요 크리에이터, 5,000+ 체험단 풀로 한국 브랜드의 일본 진출을 설계합니다.',
    url: `${siteUrl}/service`,
    provider: { '@id': 'https://www.koreaners.co/#organization' },
    areaServed: [
      { '@type': 'Country', name: 'South Korea' },
      { '@type': 'Country', name: 'Japan' },
    ],
    audience: {
      '@type': 'BusinessAudience',
      audienceType: '한국 브랜드 (B2B), 일본 시장 진출 기업',
    },
    inLanguage: ['ko', 'ja'],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(service) }}
      />
      <ServiceContent />
    </>
  )
}
