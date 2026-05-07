import { MetadataRoute } from 'next'
import { createStaticClient } from '@/lib/supabase/static'

// 정적 콘텐츠 페이지의 실제 마지막 카피 변경일. 페이지 콘텐츠를 수정하면 이 값도 함께 갱신.
const STATIC_CONTENT_DATES: Record<string, string> = {
  '/about': '2026-04-02',
  '/service': '2026-03-29',
  '/careers': '2026-04-19',
  '/contact': '2026-02-28',
  '/privacy': '2025-09-01',
}

// XML escape — Next 16 MetadataRoute.Sitemap 이 image:loc 의 & 를 자동 escape 안 함.
// 미escape 시 sitemap.xml not well-formed → Google image annotation 드롭.
function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.koreaners.co'
  const today = new Date().toISOString().slice(0, 10)

  let maxPortfolio = today
  let maxBlog = today
  let maxCreator = today
  let portfolioPages: MetadataRoute.Sitemap = []
  let blogPages: MetadataRoute.Sitemap = []
  let creatorPages: MetadataRoute.Sitemap = []

  try {
    const supabase = createStaticClient()

    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, published_at, created_at, thumbnail_url')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (portfolioError) {
      console.error('[sitemap] portfolios query failed:', portfolioError.message)
    }
    if (portfolios?.length) {
      const portfolioDates = portfolios.map((p) => p.published_at || p.created_at).filter(Boolean) as string[]
      if (portfolioDates.length) {
        maxPortfolio = portfolioDates.sort().reverse()[0].slice(0, 10)
      }
      portfolioPages = portfolios.map((portfolio) => ({
        url: `${baseUrl}/portfolio/${portfolio.id}`,
        lastModified: (portfolio.published_at || portfolio.created_at || today).slice(0, 10),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        ...(portfolio.thumbnail_url ? { images: [portfolio.thumbnail_url] } : {}),
      }))
    }

    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, title, category, updated_at, published, thumbnail_url')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    if (blogError) {
      console.error('[sitemap] blog_posts query failed:', blogError.message)
    }
    if (blogPosts?.length) {
      maxBlog = blogPosts[0].updated_at || today
      blogPages = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at || today,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: [
          xmlEscape(`${baseUrl}/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category || '')}`),
        ],
      }))
    }

    const { data: creators, error: creatorError } = await supabase
      .from('creators')
      .select('id, created_at')
      .order('created_at', { ascending: false })

    if (creatorError) {
      console.error('[sitemap] creators query failed:', creatorError.message)
    }
    if (creators?.length) {
      maxCreator = creators[0].created_at?.slice(0, 10) || today
      creatorPages = creators.map((creator) => ({
        url: `${baseUrl}/creator/${creator.id}`,
        lastModified: (creator.created_at || today).slice(0, 10),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('[sitemap] Supabase query failed:', error)
  }

  const maxAll = [maxPortfolio, maxBlog, maxCreator].sort().reverse()[0]

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: maxAll,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: maxPortfolio,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: maxBlog,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creator`,
      lastModified: maxCreator,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: STATIC_CONTENT_DATES['/about'],
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: STATIC_CONTENT_DATES['/service'],
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: STATIC_CONTENT_DATES['/careers'],
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: STATIC_CONTENT_DATES['/contact'],
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: STATIC_CONTENT_DATES['/privacy'],
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  return [...staticPages, ...portfolioPages, ...blogPages, ...creatorPages]
}
