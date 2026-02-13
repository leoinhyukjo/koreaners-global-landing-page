import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.koreaners.co'
  const currentDate = new Date().toISOString()

  // 정적 페이지 목록
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/creator`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/inquiry`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  try {
    const supabase = await createClient()

    // 포트폴리오 페이지 추가
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })

    const portfolioPages: MetadataRoute.Sitemap = portfolios?.map((portfolio) => ({
      url: `${baseUrl}/portfolio/${portfolio.id}`,
      lastModified: portfolio.updated_at || currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    })) || []

    // 블로그 포스트 페이지 추가
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, updated_at, published')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    const blogPages: MetadataRoute.Sitemap = blogPosts?.map((post) => ({
      url: `${baseUrl}/blog/${post.id}`,
      lastModified: post.updated_at || currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    })) || []

    // 크리에이터 프로필 페이지 추가 (있는 경우)
    const { data: creators } = await supabase
      .from('creators')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })

    const creatorPages: MetadataRoute.Sitemap = creators?.map((creator) => ({
      url: `${baseUrl}/creator/${creator.id}`,
      lastModified: creator.updated_at || currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    })) || []

    return [...staticPages, ...portfolioPages, ...blogPages, ...creatorPages]
  } catch (error) {
    console.error('Sitemap 생성 중 오류:', error)
    // 오류 발생 시 정적 페이지만 반환
    return staticPages
  }
}
