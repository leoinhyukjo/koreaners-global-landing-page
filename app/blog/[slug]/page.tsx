// 블로그 상세 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/lib/supabase'
import Navigation from '@/components/navigation'
import { BlogPostView } from '@/components/blog/blog-post-view'
import { resolveThumbnailSrc, toAbsoluteUrl } from '@/lib/thumbnail'
import { safeJsonLdStringify } from '@/lib/json-ld'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient()
    
    const { data, error: supabaseError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (supabaseError) {
      console.error('[Blog Detail] 에러: ' + (supabaseError.message || '알 수 없는 에러'))
      return null
    }

    if (!data || !data.published) {
      return null
    }

    return data
  } catch (err: any) {
    console.error('[Blog Detail] 에러: ' + (err?.message || '알 수 없는 에러'))
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const blogPost = await getBlogPost(slug)

  if (!blogPost) {
    return {
      title: '블로그 포스트를 찾을 수 없습니다',
      description: '요청하신 블로그 포스트를 찾을 수 없습니다.',
    }
  }

  const metaTitle = blogPost.meta_title || blogPost.title
  const metaDescription = blogPost.meta_description || blogPost.summary || `${blogPost.title} - ${blogPost.category}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'
  const ogImage = toAbsoluteUrl(siteUrl, resolveThumbnailSrc(blogPost.thumbnail_url))

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      publishedTime: blogPost.created_at,
      modifiedTime: blogPost.updated_at,
      authors: ['KOREANERS'],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: blogPost.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${slug}`,
    },
  }
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params
  const blogPost = await getBlogPost(slug)

  if (!blogPost) {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koreaners.co'
  
  // 카테고리에 따라 스키마 타입 결정
  const isNews = blogPost.category === '마케팅 뉴스' || blogPost.category === '업계 동향'
  const schemaType = isNews ? 'NewsArticle' : 'BlogPosting'
  const thumbnailSrc = resolveThumbnailSrc(blogPost.thumbnail_url)
  const thumbnailAbsolute = toAbsoluteUrl(siteUrl, thumbnailSrc)
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: blogPost.meta_title || blogPost.title,
    description: blogPost.meta_description || blogPost.summary || blogPost.title,
    image: [thumbnailAbsolute],
    datePublished: blogPost.created_at,
    dateModified: blogPost.updated_at,
    author: {
      '@type': 'Organization',
      name: 'KOREANERS',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KOREANERS',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${slug}`,
    },
    articleSection: blogPost.category,
    keywords: blogPost.category,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <Navigation />
      <BlogPostView blogPost={blogPost} thumbnailSrc={thumbnailSrc} />
    </>
  )
}
