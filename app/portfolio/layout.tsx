import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '포트폴리오 - 일본 마케팅 캠페인 성과',
  description: '코리너스가 운영한 일본 마케팅 캠페인 포트폴리오. K-뷰티, K-푸드, 라이프스타일 등 다양한 브랜드의 일본 시장 진출 성공 사례를 확인하세요.',
  alternates: { canonical: '/portfolio' },
}

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children
}
