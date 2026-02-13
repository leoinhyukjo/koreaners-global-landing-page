import type { Metadata } from 'next'
import Navigation from '@/components/navigation'
import { MainContent } from '@/components/main-content'

export const metadata: Metadata = {
  title: '코리너스 | 일본 인플루언서 마케팅 & 현지화 전략 파트너',
  description: '일본 시장 진출의 확실한 파트너, 코리너스. 인플루언서 캠페인, 대량 시딩, 콘텐츠 제작, 데이터 기반 리포팅까지 크로스보더 마케팅 전 과정을 설계하고 운영합니다.',
  alternates: { canonical: '/' },
}

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-900 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <MainContent />
    </main>
  )
}
