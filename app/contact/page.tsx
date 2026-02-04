'use client'

import React from 'react'
import Navigation from '@/components/navigation'
import { SafeHydration } from '@/components/common/SafeHydration'
import { FooterCTA } from '@/components/footer-cta'

const ContactSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center pt-24 sm:pt-28" aria-hidden="true">
    <div className="h-32 w-full max-w-2xl mx-auto rounded-none animate-pulse bg-zinc-800/50" />
  </div>
)

/**
 * /contact — 메인 페이지 하단 'Contact Us' 섹션(FooterCTA)과 100% 동일한 UI·로직.
 * 헤더·푸터 사이 여백만 추가.
 */
export default function ContactPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-900">
      <Navigation />
      <SafeHydration fallback={<ContactSkeleton />}>
        <div className="pt-24 sm:pt-28 pb-12 sm:pb-20">
          <FooterCTA />
        </div>
      </SafeHydration>
    </main>
  )
}
