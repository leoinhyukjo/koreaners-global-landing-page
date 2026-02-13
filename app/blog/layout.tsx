import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '블로그 - 일본 마케팅 인사이트 & 트렌드',
  description: '일본 시장 트렌드, 인플루언서 마케팅 전략, 크로스보더 마케팅 노하우를 공유하는 코리너스 블로그.',
  alternates: { canonical: '/blog' },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
