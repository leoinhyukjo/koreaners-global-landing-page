import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '서비스 소개 - 인플루언서 마케팅 & 시딩',
  description: '코리너스의 핵심 서비스: 일본 인플루언서 캠페인 기획·운영, 5,000명 이상 대량 시딩, 실시간 데이터 리포팅. ROAS 450%, 전환율 8.5% 달성 사례.',
  alternates: { canonical: '/service' },
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children
}
