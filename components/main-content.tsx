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
      <MarketOpportunity />
      <Performance />
      <Barriers />
      <SolutionRoadmap />
      <FinalCTA />
      <ClientShowcase />
      <FooterCTA />
    </>
  )
}
