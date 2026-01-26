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
    <section className="py-12 sm:py-16 relative bg-black border-t border-zinc-800">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-balance break-keep">
              <span className="text-white">일본 시장 진출의 </span>
              <span className="text-white">4가지 장벽</span>
            </h2>
            <p className="text-lg text-zinc-400 break-keep max-w-prose mx-auto">
              많은 기업들이 이 장벽 앞에서 실패합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {barriers.map((barrier, index) => (
              <Card
                key={index}
                className="p-6 bg-zinc-900 border-zinc-800 hover:border-white hover:-translate-y-1 transition-all duration-200 group rounded-none"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-200 rounded-none">
                      <barrier.icon className="w-7 h-7 text-white group-hover:text-black transition-colors duration-200" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-2 break-keep">
                      {barrier.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed break-keep text-sm">
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
