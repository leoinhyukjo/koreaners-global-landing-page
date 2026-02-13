import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '크리에이터 - 전속 & 파트너 크리에이터 모집',
  description: '코리너스와 함께 성장할 크리에이터를 모집합니다. 전속 크리에이터(콘텐츠 기획~굿즈 판매 전 과정 지원) 및 파트너 크리에이터(프로젝트별 자유 협업) 두 가지 트랙 운영.',
  alternates: { canonical: '/creator' },
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
