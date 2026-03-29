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
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  try {
    const supabase = await createClient()

    // 포트폴리오 페이지 추가 (썸네일 이미지 포함)
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id, title, updated_at, thumbnail_url')
      .order('updated_at', { ascending: false })

    const portfolioPages: MetadataRoute.Sitemap = portfolios?.map((portfolio) => ({
      url: `${baseUrl}/portfolio/${portfolio.id}`,
      lastModified: portfolio.updated_at || currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
      ...(portfolio.thumbnail_url ? {
        images: [portfolio.thumbnail_url],
      } : {}),
    })) || []

    // 블로그 포스트 페이지 추가 (썸네일 이미지 포함)
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, title, updated_at, published, thumbnail_url')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    const blogPages: MetadataRoute.Sitemap = blogPosts?.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updated_at || currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
      ...(post.thumbnail_url ? {
        images: [post.thumbnail_url],
      } : {}),
    })) || []

    // 크리에이터 프로필 페이지 추가
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
