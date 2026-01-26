// 블로그 상세 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/lib/supabase'
import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { BlogContent } from '@/components/blog/blog-content'
import Image from 'next/image'
import { resolveThumbnailSrc, toAbsoluteUrl } from '@/lib/thumbnail'

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://koreaners-global.com'
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
      authors: ['KOREANERS GLOBAL'],
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://koreaners-global.com'
  
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
      name: 'KOREANERS GLOBAL',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KOREANERS GLOBAL',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen relative overflow-hidden bg-black">
        <Navigation />
        
        <article className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 relative z-10">
          <div className="container mx-auto max-w-4xl">
            {/* 헤더 */}
            <header className="mb-8 sm:mb-12">
              <Link href="/blog">
                <Button variant="ghost" className="mb-4 sm:mb-6 min-h-[44px] break-keep text-white hover:bg-zinc-900 border-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  목록으로
                </Button>
              </Link>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 썸네일 - 제목 위에 배치 (없으면 기본 이미지) */}
                <div className="aspect-video rounded-none overflow-hidden border border-zinc-800 relative bg-zinc-950">
                  <Image
                    src={thumbnailSrc}
                    alt={`${blogPost.title} - ${blogPost.category} 블로그 포스트`}
                    fill
                    sizes="(min-width: 1024px) 896px, 100vw"
                    className="object-cover"
                    priority
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap break-keep">
                    <Badge variant="secondary" className="text-xs break-keep bg-zinc-900 text-zinc-300 border-zinc-800 rounded-none">{blogPost.category}</Badge>
                    <time className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1 break-keep" dateTime={blogPost.created_at}>
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      {new Date(blogPost.created_at).toLocaleDateString('ko-KR')}
                    </time>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight break-keep text-white">
                    {blogPost.title}
                  </h1>
                </div>
              </div>
            </header>

            {/* 요약부 - 별도 박스로 구분 */}
            {blogPost.summary && (
              <div className="mb-10 sm:mb-12">
                <div className="border border-zinc-800 bg-zinc-900/30 p-4 sm:p-6 md:p-8 rounded-none">
                  <p className="text-base sm:text-lg md:text-xl text-zinc-300 leading-relaxed break-keep">
                    {blogPost.summary}
                  </p>
                </div>
                {/* 요약부와 본문 사이 구분선 */}
                <div className="mt-10 sm:mt-12 border-t border-zinc-800"></div>
              </div>
            )}

            {/* 본문 - 큰 박스로 감싸기 */}
            <div className={`${blogPost.summary ? 'mt-0' : 'mt-10 sm:mt-12'} border border-zinc-700 bg-zinc-900/20 p-4 sm:p-6 md:p-8 lg:p-10 rounded-none blog-content-wrapper`}>
              <div className="prose prose-lg dark:prose-invert max-w-none break-keep text-zinc-300 leading-relaxed">
                <BlogContent blogPost={blogPost} />
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}
