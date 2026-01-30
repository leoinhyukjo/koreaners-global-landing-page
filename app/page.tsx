import type { Metadata } from 'next'
import { HeroSection } from '@/components/hero-section'
import { MarketOpportunity } from '@/components/market-opportunity'
import { Barriers } from '@/components/barriers'
import { SolutionRoadmap } from '@/components/solution-roadmap'
import { Performance } from '@/components/performance'
import { TrustSignals } from '@/components/trust-signals'
import { FinalCTA } from '@/components/final-cta'
import { Navigation } from '@/components/navigation'
import { FooterCTA } from '@/components/footer-cta'
import { FloatingCTA } from '@/components/floating-cta'
import { WelcomePopup } from '@/components/welcome-popup'

export const metadata: Metadata = {
  title: '코리너스 글로벌 | 일본 마케팅 & 현지화 전략 파트너',
  description: '일본 진출 및 현지 마케팅의 확실한 해답, 코리너스 글로벌',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-900">
      <Navigation />
      <HeroSection />
      <MarketOpportunity />
      <Barriers />
      <SolutionRoadmap />
      <Performance />
      <FinalCTA />
      <TrustSignals />
      <FooterCTA />
      <FloatingCTA />
      <WelcomePopup />
    </main>
  )
}
