'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, Users, ShoppingBag } from 'lucide-react'

export function MarketOpportunity() {
  const stats = [
    {
      icon: Users,
      title: '방한 일본인',
      value: '500만',
      subtitle: '2025년 시대',
      description: '일본 관광객 급증으로 K-브랜드 인지도 상승',
    },
    {
      icon: ShoppingBag,
      title: 'Qoo10 Japan',
      value: '25%',
      subtitle: 'K-뷰티 점유율',
      description: '일본 이커머스 시장 K-뷰티 돌풍',
    },
    {
      icon: TrendingUp,
      title: '일본 2030',
      value: '90%',
      subtitle: 'SNS 기반 구매',
      description: '소셜미디어가 구매 결정의 핵심 채널',
    },
  ]

  return (
    <section id="market" className="py-24 relative">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance break-keep">
              <span className="text-primary inline-block">폭발적으로 성장하는</span>{' '}
              <span className="text-foreground inline-block">일본 시장 기회</span>
            </h2>
            <p className="text-xl text-muted-foreground break-keep max-w-prose mx-auto">
              지금이 일본 시장 진출의 최적기입니다
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="relative p-8 bg-card border-border hover:border-primary hover:shadow-[0_0_30px_rgba(217,255,0,0.2)] hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/30 group-hover:scale-150 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <stat.icon className="w-12 h-12 text-primary" />
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </div>
                    <div className="text-5xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-lg text-foreground font-semibold">
                      {stat.subtitle}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed break-keep">
                    {stat.description}
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
