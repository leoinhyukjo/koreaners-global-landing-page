import { HeroSection } from '@/components/hero-section'
import { MarketOpportunity } from '@/components/market-opportunity'
import { Barriers } from '@/components/barriers'
import { SolutionRoadmap } from '@/components/solution-roadmap'
import { Performance } from '@/components/performance'
import { TrustSignals } from '@/components/trust-signals'
import { FinalCTA } from '@/components/final-cta'
import { Navigation } from '@/components/navigation'
import { FooterCTA } from '@/components/footer-cta'
import { Footer } from '@/components/footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-black">
      <Navigation />
      <HeroSection />
      <MarketOpportunity />
      <Barriers />
      <SolutionRoadmap />
      <Performance />
      <FinalCTA />
      <TrustSignals />
      <FooterCTA />
      <Footer />
    </main>
  )
}
