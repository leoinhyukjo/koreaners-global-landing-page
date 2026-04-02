import type { Metadata } from 'next'
import BlogPageContent from '@/components/blog-content'
import { safeJsonLdStringify } from '@/lib/json-ld'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '블로그 | 크로스보더 마케팅 인사이트 & 트렌드',
  description:
    '크로스보더 인플루언서 마케팅 비용 가이드, 플랫폼별 전략, 업종별 사례 등 해외 시장 진출에 필요한 실전 인사이트를 제공합니다.',
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: '코리너스 블로그 | 크로스보더 마케팅 인사이트',
    description: '크로스보더 인플루언서 마케팅 비용, 전략, 사례. 전문 에이전시의 실전 인사이트.',
    url: `${siteUrl}/blog`,
  },
}

export default function BlogPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '블로그' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumb) }}
      />
      <BlogPageContent />
    </>
  )
}
