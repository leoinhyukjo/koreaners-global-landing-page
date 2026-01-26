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
    <section id="solution" className="py-24 relative">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance break-keep">
              <span className="text-foreground">코리너스의 </span>
              <span className="text-primary">4단계 솔루션</span>
            </h2>
            <p className="text-xl text-muted-foreground break-keep max-w-prose mx-auto">
              데이터 기반 성장 설계로 성공을 보장합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="relative p-8 bg-card border-border hover:border-primary hover:shadow-[0_0_30px_rgba(217,255,0,0.2)] hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
              >
                {/* Step number background */}
                <div className="absolute top-4 right-4 text-8xl font-bold text-primary/5 group-hover:text-primary/15 group-hover:scale-110 transition-all duration-500">
                  {step.number}
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <step.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {step.tag}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-2 break-keep">
                    {step.title}
                  </h3>
                  
                  <p className="text-primary font-semibold mb-6 break-keep">
                    {step.description}
                  </p>

                  <ul className="space-y-2">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-muted-foreground break-keep">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
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
