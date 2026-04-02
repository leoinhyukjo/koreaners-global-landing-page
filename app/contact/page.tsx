import type { Metadata } from 'next'
import ContactContent from '@/components/contact-content'
import { safeJsonLdStringify } from '@/lib/json-ld'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '문의하기 | 크로스보더 인플루언서 마케팅 상담',
  description:
    '크로스보더 인플루언서 마케팅, 시딩, 콘텐츠 제작 등 해외 시장 진출에 대해 문의하세요. 코리너스가 맞춤 전략을 제안해 드립니다.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: '코리너스 문의하기 | 크로스보더 마케팅 상담',
    description: '크로스보더 인플루언서 마케팅 전문 상담. 맞춤 전략 제안.',
    url: `${siteUrl}/contact`,
  },
}

export default function ContactPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '문의하기' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumb) }}
      />
      <ContactContent />
    </>
  )
}
