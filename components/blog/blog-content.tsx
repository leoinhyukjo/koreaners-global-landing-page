'use client'

import dynamic from 'next/dynamic'
import type { BlogPost } from '@/lib/supabase'

interface BlogContentProps {
  blogPost: BlogPost
}

// BlockNote 에디터를 클라이언트 사이드에서만 로드
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

export function BlogContent({ blogPost }: BlogContentProps) {
  if (!blogPost?.content || !Array.isArray(blogPost.content) || blogPost.content.length === 0) {
    return <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
  }

  return <BlogContentClient blogPost={blogPost} />
}
