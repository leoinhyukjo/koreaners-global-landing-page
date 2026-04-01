'use client'

import React from 'react'
import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { FooterCTA } from '@/components/footer-cta'
import { AuroraBackground } from '@/components/ui/aurora-background'

const ContactSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center pt-24 sm:pt-28" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto rounded-[var(--radius)] animate-pulse bg-card/50" />
  </div>
)

/**
 * /contact — 메인 페이지 하단 'Contact Us' 섹션(FooterCTA)과 100% 동일한 UI·로직.
 * 헤더·푸터 사이 여백만 추가.
 */
export default function ContactContent() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-background relative">
      <AuroraBackground
        blobs={[
          { color: 'rgba(255,69,0,0.06)', size: 500, top: '5%', left: '55%', animation: 'aurora-float', duration: '18s' },
          { color: 'rgba(245,158,11,0.05)', size: 350, top: '50%', left: '10%', animation: 'aurora-float-reverse', duration: '22s' },
        ]}
        withDotPattern={false}
      />
      <Navigation />
      <SafeHydration fallback={<ContactSkeleton />}>
        <div className="pt-24 sm:pt-28 pb-12 sm:pb-20 relative z-10">
          <FooterCTA />
        </div>
      </SafeHydration>
    </main>
  )
}
