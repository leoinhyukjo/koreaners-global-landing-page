import type { Metadata } from 'next'
import PortfolioContent from '@/components/portfolio-content'
import { safeJsonLdStringify } from '@/lib/json-ld'
import { createStaticClient } from '@/lib/supabase/static'
import type { Portfolio } from '@/lib/supabase'

export const revalidate = 3600 // 1시간 ISR

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '포트폴리오 | 일본 인플루언서 마케팅 캠페인 사례',
  description:
    'K-뷰티, F&B, 패션, 의료관광 등 300+ 브랜드의 일본 인플루언서 마케팅 캠페인 사례를 확인하세요. 코리너스의 성과 기반 포트폴리오.',
  alternates: { canonical: `${siteUrl}/portfolio` },
  openGraph: {
    title: '코리너스 포트폴리오 | 일본 마케팅 캠페인 사례',
    description: 'K-뷰티, F&B, 패션 등 300+ 브랜드 일본 인플루언서 캠페인 사례.',
    url: `${siteUrl}/portfolio`,
  },
}

async function getPortfolios(): Promise<Portfolio[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Portfolio Index] 에러: ' + (error.message || '알 수 없는 에러'))
      return []
    }
    return Array.isArray(data) ? data : []
  } catch (err: any) {
    console.error('[Portfolio Index] 에러: ' + (err?.message || '알 수 없는 에러'))
    return []
  }
}

export default async function PortfolioPage() {
  const initialPortfolios = await getPortfolios()

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: '포트폴리오' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumb) }}
      />
      <PortfolioContent initialPortfolios={initialPortfolios} />
    </>
  )
}
