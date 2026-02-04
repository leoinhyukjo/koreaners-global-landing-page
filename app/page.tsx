import type { Metadata } from 'next'
import Navigation from '@/components/navigation'
import { MainContent } from '@/components/main-content'

export const metadata: Metadata = {
  title: '코리너스 | 일본 마케팅 & 현지화 전략 파트너',
  description: '일본 진출 및 현지 마케팅의 확실한 해답, 코리너스',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-900 w-full max-w-full overflow-x-hidden">
      <Navigation />
      <MainContent />
    </main>
  )
}
