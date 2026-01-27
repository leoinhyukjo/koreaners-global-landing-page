'use client'

import { Card } from '@/components/ui/card'
import { Activity, Sprout, Zap, Settings } from 'lucide-react'

export function SolutionRoadmap() {
  const steps = [
    {
      number: '01',
      icon: Activity,
      tag: 'Diagnostic',
      title: '시장 진단 및 성과 설계',
      description: '30만 커뮤니티 빅데이터 활용',
      features: [
        '일본 소비자 트렌드 분석',
        '경쟁사 벤치마킹',
        '성장 로드맵 설계',
      ],
    },
    {
      number: '02',
      icon: Sprout,
      tag: 'Seeding',
      title: '검색 장벽 제거',
      description: '5,000명 체험단 & 로컬 미디어',
      features: [
        '인플루언서 체험단 운영',
        '구전 효과 극대화',
        '검색 노출 최적화',
      ],
    },
    {
      number: '03',
      icon: Zap,
      tag: 'Impact',
      title: '전환 극대화',
      description: '105명 전속 크리에이터 기반 구매 엔진',
      features: [
        '고품질 콘텐츠 제작',
        '퍼포먼스 마케팅',
        '실시간 성과 최적화',
      ],
    },
    {
      number: '04',
      icon: Settings,
      tag: 'Management',
      title: '운영 리스크 제로',
      description: '인하우스 1:1 전담 시스템',
      features: [
        '일본어 네이티브 지원',
        'CS 및 운영 대행',
        '지속적인 개선',
      ],
    },
  ]

  return (
    <section id="solution" className="py-12 sm:py-16 relative bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 border-t border-zinc-700/50">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-balance break-keep">
              <span className="text-white">코리너스의 </span>
              <span className="text-white">4단계 솔루션</span>
            </h2>
            <p className="text-lg text-zinc-200 break-keep max-w-prose mx-auto">
              데이터 기반 성장 설계로 성공을 보장합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="relative p-6 bg-zinc-800 border-zinc-700/50 hover:border-white hover:-translate-y-1 transition-all duration-200 group overflow-hidden rounded-none"
              >
                {/* Step number background */}
                <div className="absolute top-4 right-4 text-7xl font-black text-zinc-800 group-hover:text-zinc-700 transition-all duration-200">
                  {step.number}
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-200 rounded-none">
                      <step.icon className="w-6 h-6 text-white group-hover:text-black transition-colors duration-200" />
                    </div>
                    <div className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-none">
                      {step.tag}
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2 break-keep">
                    {step.title}
                  </h3>
                  
                  <p className="text-white font-bold mb-4 break-keep text-sm">
                    {step.description}
                  </p>

                  <ul className="space-y-1.5">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-200 break-keep text-sm">
                        <div className="w-1 h-1 bg-white" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
