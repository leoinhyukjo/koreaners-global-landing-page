'use client'

export function FinalCTA() {
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden bg-black border-t border-zinc-800">
      <div className="container mx-auto px-5 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-balance leading-tight break-keep">
            <span className="text-white inline-block">데이터로 진단하고</span>{' '}
            <span className="text-white inline-block">인프라로 성장을 설계합니다</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-zinc-400 mb-12 text-balance break-keep px-2 max-w-prose mx-auto">
            코리너스와 함께 글로벌 시장을 선점하세요
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-8 border-t border-zinc-800">
            <div>
              <div className="text-4xl font-black text-white mb-2">300+</div>
              <div className="text-sm text-zinc-400">지원 브랜드</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">105</div>
              <div className="text-sm text-zinc-400">전속 크리에이터</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">30만</div>
              <div className="text-sm text-zinc-400">커뮤니티 회원</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">250%</div>
              <div className="text-sm text-zinc-400">평균 ROI</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
