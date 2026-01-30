'use client'

import { SafeHydration } from '@/components/common/SafeHydration'
import { HeroSection } from '@/components/hero-section'
import { MarketOpportunity } from '@/components/market-opportunity'
import { Barriers } from '@/components/barriers'
import { SolutionRoadmap } from '@/components/solution-roadmap'
import { Performance } from '@/components/performance'
import { TrustSignals } from '@/components/trust-signals'
import { FinalCTA } from '@/components/final-cta'
import { FooterCTA } from '@/components/footer-cta'
import { FloatingCTA } from '@/components/floating-cta'
import { WelcomePopup } from '@/components/welcome-popup'

const MainSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center pt-24" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto bg-zinc-800/50 rounded animate-pulse" />
  </div>
)

/**
 * 메인 페이지 본문. t() 사용으로 인한 서버/클라이언트 불일치 방지를 위해 SafeHydration으로 감쌈.
 */
export function MainContent() {
  return (
    <SafeHydration fallback={<MainSkeleton />}>
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
    </SafeHydration>
  )
}
