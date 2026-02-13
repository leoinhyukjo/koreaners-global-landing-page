import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '채용 - 코리너스와 함께할 인재를 찾습니다',
  description: '코리너스 채용 정보. 크로스보더 마케팅 전문 기업에서 프로젝트 매니저, BizOps 등 다양한 포지션을 모집하고 있습니다. 일본 시장과 K-브랜드를 연결하는 일에 함께하세요.',
  alternates: { canonical: '/careers' },
}

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children
}
