'use client'

import dynamic from 'next/dynamic'
import type { BlogPost } from '@/lib/supabase'

interface BlogContentProps {
  blogPost: BlogPost
  /** 로케일별 본문. 없으면 blogPost.content 사용 */
  content?: any[]
}

const BlogContentClient = dynamic(
  () => import('./blog-content-client').then((mod) => ({ default: mod.BlogContentClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">콘텐츠를 불러오는 중...</p>
      </div>
    ),
  }
)

export function BlogContent({ blogPost, content }: BlogContentProps) {
  const blocks = content ?? (blogPost?.content && Array.isArray(blogPost.content) ? blogPost.content : [])
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
  }
  return <BlogContentClient blogPost={blogPost} content={blocks} />
}
