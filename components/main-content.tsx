'use client'

import HeroSection from '@/components/hero-section'
import { TrustSignals } from '@/components/trust-signals'
import { MarketOpportunity } from '@/components/market-opportunity'
import { Barriers } from '@/components/barriers'
import { SolutionRoadmap } from '@/components/solution-roadmap'
import { Performance } from '@/components/performance'
import { ClientShowcase } from '@/components/client-showcase'
import { FinalCTA } from '@/components/final-cta'
import { FooterCTA } from '@/components/footer-cta'

export function MainContent() {
  return (
    <>
      <HeroSection />
      <TrustSignals />
      {/* 신뢰 블록(RESULTS 스탯) 상단 배치 — 평균 스크롤 33% 데드존 대응 (Task 1.3) */}
      <FinalCTA />
      <MarketOpportunity />
      <Performance />
      <Barriers />
      <SolutionRoadmap />
      <ClientShowcase />
      <FooterCTA />
    </>
  )
}
