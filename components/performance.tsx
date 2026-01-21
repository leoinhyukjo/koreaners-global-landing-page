'use client'

import { Card } from '@/components/ui/card'
import { Sparkles, TrendingUp, Users2 } from 'lucide-react'

export function Performance() {
  const results = [
    {
      icon: Sparkles,
      category: 'Beauty',
      result: '매출 150% 성장',
      description: 'K-뷰티 브랜드 일본 진출 6개월 만에',
    },
    {
      icon: TrendingUp,
      category: 'Fashion',
      result: '점당 매출 150% 증가',
      description: '오프라인 팝업스토어 성공적 런칭',
    },
    {
      icon: Users2,
      category: 'F&B',
      result: '주간 2만 명 방문',
      description: '신제품 출시 이벤트 대성공',
    },
  ]

  return (
    <section id="performance" className="py-24 relative bg-card/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              <span className="text-foreground">검증된 </span>
              <span className="text-primary">성과</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              다양한 산업군에서 탁월한 결과를 만들어냈습니다
            </p>
            
            {/* Industry badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['Beauty', 'Fashion', 'F&B', 'Cosmetics', 'Lifestyle', 'Health'].map((industry, idx) => (
                <div
                  key={industry}
                  className="px-4 py-2 rounded-full bg-card border border-border text-foreground text-sm hover:border-primary hover:bg-primary/10 hover:scale-110 transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {industry}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <Card
                key={index}
                className="relative p-8 bg-card border-border hover:border-primary hover:shadow-[0_0_30px_rgba(217,255,0,0.2)] hover:-translate-y-2 transition-all duration-500 group text-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <result.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {result.category}
                  </div>
                  
                  <div className="text-3xl font-bold text-primary mb-4">
                    {result.result}
                  </div>
                  
                  <p className="text-foreground text-sm">
                    {result.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
