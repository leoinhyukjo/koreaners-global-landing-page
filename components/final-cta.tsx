'use client'

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-card/20">
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            <span className="text-foreground">데이터로 진단하고</span>
            <br />
            <span className="text-primary">인프라로 성장을 설계합니다</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-16 text-balance">
            코리너스와 함께 글로벌 시장을 선점하세요
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-border">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">300+</div>
              <div className="text-sm text-muted-foreground">지원 브랜드</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">105</div>
              <div className="text-sm text-muted-foreground">전속 크리에이터</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">30만</div>
              <div className="text-sm text-muted-foreground">커뮤니티 회원</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">250%</div>
              <div className="text-sm text-muted-foreground">평균 ROI</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
