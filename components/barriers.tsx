'use client'

import { Card } from '@/components/ui/card'
import { Database, Shield, Target, AlertTriangle } from 'lucide-react'

export function Barriers() {
  const barriers = [
    {
      icon: Database,
      title: 'Data Black-box',
      description: '시장 데이터가 불투명해 정확한 진단이 불가능',
    },
    {
      icon: Shield,
      title: 'Trust Barrier',
      description: '현지 소비자 신뢰 구축이 어렵고 시간이 오래 걸림',
    },
    {
      icon: Target,
      title: 'Lack of Strategy',
      description: '일회성 캠페인으로는 지속 가능한 성장 불가',
    },
    {
      icon: AlertTriangle,
      title: 'Operational Risk',
      description: '언어, 문화, 운영 리스크로 인한 실패 가능성',
    },
  ]

  return (
    <section className="py-24 relative bg-card/20">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance break-keep">
              <span className="text-foreground">일본 시장 진출의 </span>
              <span className="text-primary">4가지 장벽</span>
            </h2>
            <p className="text-xl text-muted-foreground break-keep max-w-prose mx-auto">
              많은 기업들이 이 장벽 앞에서 실패합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {barriers.map((barrier, index) => (
              <Card
                key={index}
                className="p-8 bg-card border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(217,255,0,0.15)] hover:-translate-y-1 transition-all duration-500 group"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <barrier.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 break-keep">
                      {barrier.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed break-keep">
                      {barrier.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
