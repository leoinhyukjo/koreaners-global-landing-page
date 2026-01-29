import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function MarketingCTA() {
  return (
    <section
      className="mt-12 sm:mt-16 py-10 sm:py-14 px-4 sm:px-6 rounded-none border border-zinc-700/50 bg-gradient-to-b from-zinc-800/90 to-zinc-900"
      aria-label="마케팅 문의"
    >
      <div className="max-w-2xl mx-auto text-center space-y-5 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight break-keep">
          일본 시장 진출과 타겟 마케팅, 코리너스가 가장 확실한 해답을 드립니다.
        </h2>
        <div className="text-sm sm:text-base text-zinc-300 leading-relaxed break-keep space-y-3">
          <p className="font-semibold text-white">
            브랜드의 가치를 현지 언어와 문화로 가장 정확하게 전달하는 것, 성공적인 일본 비즈니스의 시작입니다.
          </p>
          <p>
            지금 바로 코리너스의 전략적인 현지화 마케팅 솔루션을 확인해보세요.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/contact">
            <Button
              size="lg"
              className="min-h-[48px] px-8 sm:px-10 text-base sm:text-lg font-bold rounded-none bg-white text-black hover:bg-zinc-100 transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
            >
              무료 상담 신청하기
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
