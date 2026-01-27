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
    <section id="market" className="py-12 sm:py-16 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-balance break-keep">
              <span className="text-white inline-block">폭발적으로 성장하는</span>{' '}
              <span className="text-white inline-block">일본 시장 기회</span>
            </h2>
            <p className="text-lg text-zinc-200 break-keep max-w-prose mx-auto">
              지금이 일본 시장 진출의 최적기입니다
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="relative p-6 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-200 group overflow-hidden rounded-none"
              >
                <div className="relative z-10">
                  <div className="mb-4">
                    <stat.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-xs text-zinc-300 mb-1 font-medium">
                      {stat.title}
                    </div>
                    <div className="text-4xl font-black text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-base text-white font-bold">
                      {stat.subtitle}
                    </div>
                  </div>
                  
                  <p className="text-zinc-200 text-sm leading-relaxed break-keep">
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
