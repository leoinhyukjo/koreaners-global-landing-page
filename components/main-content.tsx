'use client'

import { SafeHydration } from '@/components/common/SafeHydration'
import HeroSection from '@/components/hero-section'
import { MarketOpportunity } from '@/components/market-opportunity'
import { Barriers } from '@/components/barriers'
import { SolutionRoadmap } from '@/components/solution-roadmap'
import { Performance } from '@/components/performance'
import { TrustSignals } from '@/components/trust-signals'
import { FinalCTA } from '@/components/final-cta'
import { FooterCTA } from '@/components/footer-cta'
import { WelcomePopup } from '@/components/welcome-popup'

/** 히어로+첫 섹션 헤더와 동일한 레이아웃 틀을 유지해 하이드레이션 시 레이아웃 시프트 방지 */
const MainSkeleton = () => (
  <div className="min-h-screen w-full max-w-full overflow-hidden" aria-hidden="true">
    <div className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-24">
      <div className="container mx-auto max-w-7xl">
        <div className="max-w-5xl mx-auto text-center w-full">
          <div className="pt-20 sm:pt-24 pb-6 sm:pb-8 min-h-[4.5rem] sm:min-h-[5rem] block">
            <div className="h-12 sm:h-14 md:h-16 bg-zinc-800/60 rounded w-3/4 mx-auto mb-2 block" />
            <div className="h-12 sm:h-14 md:h-16 bg-zinc-800/60 rounded w-2/3 mx-auto block" />
          </div>
          <div className="pt-12 sm:pt-14 pb-10 sm:pb-12 min-h-[3rem] block">
            <div className="h-8 sm:h-10 md:h-12 bg-zinc-800/50 rounded w-1/2 mx-auto block" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 min-h-[3rem]">
            <div className="h-12 bg-zinc-800/50 rounded w-full sm:w-48 mx-auto sm:mx-0" />
            <div className="h-12 bg-zinc-800/50 rounded w-full sm:w-48 mx-auto sm:mx-0" />
          </div>
        </div>
      </div>
    </div>
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-24 border-t border-zinc-800/50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 block">
          <div className="h-8 sm:h-10 bg-zinc-800/50 rounded w-2/3 mx-auto mb-4 block" />
          <div className="h-5 bg-zinc-800/40 rounded w-full max-w-md mx-auto block" />
        </div>
      </div>
    </div>
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
      <WelcomePopup />
    </SafeHydration>
  )
}
