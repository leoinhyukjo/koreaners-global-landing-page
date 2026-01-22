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
  const ogImage = blogPost.thumbnail_url || `${siteUrl}/og-default.png`

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
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: blogPost.meta_title || blogPost.title,
    description: blogPost.meta_description || blogPost.summary || blogPost.title,
    image: blogPost.thumbnail_url ? [blogPost.thumbnail_url] : [],
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
      <main className="min-h-screen bg-background">
        <Navigation />
        
        <article className="pt-32 pb-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* 헤더 */}
            <header className="mb-8">
              <Link href="/blog">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  목록으로
                </Button>
              </Link>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary">{blogPost.category}</Badge>
                    <time className="text-sm text-muted-foreground flex items-center gap-1" dateTime={blogPost.created_at}>
                      <Calendar className="h-4 w-4" />
                      {new Date(blogPost.created_at).toLocaleDateString('ko-KR')}
                    </time>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight text-foreground dark:text-foreground">
                    {blogPost.title}
                  </h1>
                  {blogPost.summary && (
                    <p className="text-xl text-muted-foreground dark:text-muted-foreground leading-relaxed tracking-normal">
                      {blogPost.summary}
                    </p>
                  )}
                </div>

                {blogPost.thumbnail_url && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={blogPost.thumbnail_url}
                      alt={`${blogPost.title} - ${blogPost.category} 블로그 포스트`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </header>

            {/* 본문 */}
            <Card className="p-8 md:p-12 bg-card dark:bg-card border-border dark:border-border">
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground dark:prose-headings:text-foreground prose-p:text-foreground/90 dark:prose-p:text-foreground/90 prose-strong:text-foreground dark:prose-strong:text-foreground">
                <div className="text-foreground dark:text-foreground leading-relaxed tracking-normal [&_p]:mb-4 [&_p]:text-base [&_p]:md:text-lg [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_ul]:my-4 [&_ol]:my-4 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
                  <BlogContent blogPost={blogPost} />
                </div>
              </div>
            </Card>
          </div>
        </article>
      </main>
    </>
  )
}
