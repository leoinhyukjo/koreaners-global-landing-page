import { notFound } from 'next/navigation'
import { GrainGradient } from '@paper-design/shaders-react'
import { BLOG_ART_CATEGORIES } from '@/lib/blog-art'

/**
 * Dev 전용 아트 베이크 페이지. production 에서는 404.
 * scripts/bake-blog-art.mjs 가 [data-art] 요소별로 스크린샷을 떠 public/blog-art/<slug>.jpg 로 저장.
 */
export default function BlogArt() {
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div className="flex flex-col gap-4 bg-black p-4">
      {BLOG_ART_CATEGORIES.map((c) => (
        <div key={c.slug} data-art={c.slug} style={{ width: 1200, height: 630 }}>
          <GrainGradient
            colorBack="#1C1917"
            colors={c.colors}
            softness={0.8}
            intensity={0.35}
            noise={0.35}
            speed={0}
            frame={c.frame}
            fit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ))}
    </div>
  )
}
