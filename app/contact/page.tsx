import type { Metadata } from 'next'
import ContactLanding, { type BrandGroup } from '@/components/contact-landing'
import { safeJsonLdStringify } from '@/lib/json-ld'
import { createStaticClient } from '@/lib/supabase/static'

export const revalidate = 3600 // 1시간 ISR (포트폴리오 브랜드 목록)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'

export const metadata: Metadata = {
  title: '문의하기 | 일본 인플루언서 마케팅 무료 상담',
  description:
    '일본 인플루언서 마케팅 무료 상담. 크리에이터 섭외부터 콘텐츠 제작, 성과 리포트까지 코리너스가 캠페인 전 과정을 직접 운영합니다.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: '코리너스 문의하기 | 일본 마케팅 무료 상담',
    description: '일본 인플루언서 마케팅 전문 상담. 맞춤 전략 제안.',
    url: `${siteUrl}/contact`,
  },
}

// 카테고리 표시 순서 (미등록 카테고리는 뒤에 알파벳순)
const CATEGORY_ORDER = ['Beauty', 'Fashion', 'F&B', 'Lifestyle']
const MAX_BRANDS_PER_GROUP = 5

async function getBrandGroups(): Promise<BrandGroup[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('portfolios')
      .select('client_name, category, published_at, created_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error || !Array.isArray(data)) {
      if (error) console.error('[Contact] portfolios 조회 에러: ' + (error.message || '알 수 없는 에러'))
      return []
    }

    const map = new Map<string, string[]>()
    for (const row of data) {
      const name = (row.client_name || '').trim()
      if (!name) continue
      const categories = (Array.isArray(row.category) ? row.category : [row.category]).filter(Boolean)
      for (const cat of categories) {
        const list = map.get(cat) ?? []
        if (!list.includes(name)) list.push(name)
        map.set(cat, list)
      }
    }

    return [...map.entries()]
      .sort((a, b) => {
        const ia = CATEGORY_ORDER.indexOf(a[0])
        const ib = CATEGORY_ORDER.indexOf(b[0])
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a[0].localeCompare(b[0])
      })
      .map(([category, brands]) => ({ category, brands: brands.slice(0, MAX_BRANDS_PER_GROUP) }))
  } catch (err: any) {
    console.error('[Contact] portfolios 조회 에러: ' + (err?.message || '알 수 없는 에러'))
    return []
  }
}

export default async function ContactPage() {
  const brandGroups = await getBrandGroups()

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
      <ContactLanding brandGroups={brandGroups} />
    </>
  )
}
