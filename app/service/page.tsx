'use client'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, Users, Target, BarChart3, Globe, CheckCircle2, MessageSquare, Database, Shield, Zap, Lightbulb, Brain, GitCompare, Clock, Share2, Bookmark } from 'lucide-react'

export default function ServicePage() {
  const painPoints = [
    {
      icon: Database,
      title: 'Data Black-box',
      description: '시장 데이터가 불투명해 정확한 진단이 불가능'
    },
    {
      icon: Shield,
      title: 'Trust Barrier',
      description: '현지 소비자 신뢰 구축이 어렵고 시간이 오래 걸림'
    },
    {
      icon: Target,
      title: 'Lack of Strategy',
      description: '일회성 캠페인으로는 지속 가능한 성장 불가'
    },
    {
      icon: AlertTriangle,
      title: 'Operational Risk',
      description: '언어, 문화, 운영 리스크로 인한 실패 가능성'
    }
  ]

  const influencerFeatures = [
    {
      title: '압도적 전속 풀',
      description: '직접 통제 가능한 전속 크리에이터 105명 및 파트너 네트워크'
    },
    {
      title: '리스크 제로 오퍼레이션',
      description: '1:1 전담 매니저를 통한 운영 리스크 원천 차단'
    },
    {
      title: '카테고리 특화',
      description: '뷰티, F&B, 패션 등 산업별 맞춤 콘텐츠 전략'
    }
  ]

  const seedingFeatures = [
    {
      title: '국내 최대 규모',
      description: '일본 현지 거주 정예 체험단 5,000명 즉각 가동'
    },
    {
      title: '신뢰 장벽 해소',
      description: '단기간 대량 후기 확보로 브랜드 공신력 선구축'
    },
    {
      title: '리얼 보이스 자산화',
      description: '실제 사용 경험 기반의 현지 최적화 콘텐츠 축적'
    }
  ]

  const trustMetrics = [
    { number: '30만', label: '글로벌 커뮤니티 데이터' },
    { number: '100+', label: '일본 언론사 제휴' },
    { number: '150%', label: '매출 성장 최대' },
    { number: '5,000명', label: '정예 체험단' }
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-5 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight break-keep">
              <div className="flex flex-col items-center gap-2">
                <span className="inline-block">단순한 대행을 넘어,</span>
                <span className="inline-block">
                  <span className="text-primary">당신의 가장 강력한 글로벌 지사</span>
                  <span>가 됩니다.</span>
                </span>
              </div>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-prose mx-auto text-balance break-keep px-2">
              데이터로 진단하고 인프라로 성장을 설계하는 코리너스만의 실행형 컨설팅 솔루션
            </p>
          </div>
        </div>
      </section>

      {/* Problem & Insight Section */}
      <section className="py-12 sm:py-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4 break-keep">
              일본 마케팅, 왜 비용만 쓰고 성과는 없는가?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground break-keep max-w-prose mx-auto px-2">
              일본 시장 진출 시 기업들이 겪는 4가지 핵심 문제점
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((point, index) => (
              <Card 
                key={index}
                className="p-8 bg-card border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] hover:-translate-y-1 transition-all duration-500 group"
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                  <point.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 break-keep">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed break-keep">
                  {point.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service 01: Influencer Marketing */}
      <section className="py-20 px-5 sm:px-6 bg-card/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-6">
                <span className="text-primary font-semibold">Service 01</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 break-keep">
                인플루언서 마케팅
              </h2>
              <p className="text-2xl text-primary font-bold mb-8 break-keep">
                팬덤을 넘어 매출로, 최적의 인적 인프라 배치
              </p>
              
              <div className="space-y-6">
                {influencerFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Users className="w-12 h-12 text-primary" />
                    <div>
                      <div className="text-4xl font-bold text-primary">105명</div>
                      <div className="text-sm text-muted-foreground">전속 크리에이터</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Target className="w-12 h-12 text-primary" />
                    <div>
                      <div className="text-4xl font-bold text-primary">0%</div>
                      <div className="text-sm text-muted-foreground">운영 리스크</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <TrendingUp className="w-12 h-12 text-primary" />
                    <div>
                      <div className="text-4xl font-bold text-primary">3개</div>
                      <div className="text-sm text-muted-foreground">카테고리 특화</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Service 02: Seeding */}
      <section className="py-20 px-5 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Globe className="w-12 h-12 text-primary" />
                    <div>
                      <div className="text-4xl font-bold text-primary">5,000명</div>
                      <div className="text-sm text-muted-foreground">정예 체험단</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-12 h-12 text-primary" />
                    <div>
                      <div className="text-4xl font-bold text-primary">대량</div>
                      <div className="text-sm text-muted-foreground">후기 확보</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-12 h-12 text-primary" />
                    <div>
                      <div className="text-4xl font-bold text-primary">실제</div>
                      <div className="text-sm text-muted-foreground">사용 경험 기반</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-6">
                <span className="text-primary font-semibold">Service 02</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 break-keep">
                정예 체험단
              </h2>
              <p className="text-2xl text-primary font-bold mb-8 break-keep">
                일본 시장 안착의 핵심, 신뢰 인프라 구축
              </p>
              
              <div className="space-y-6">
                {seedingFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-2 break-keep">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground break-keep">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data & Reporting Section */}
      <section className="py-20 px-5 sm:px-6 relative overflow-hidden bg-gradient-to-br from-background via-card/30 to-background">
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 break-keep">
              <span className="inline-block">결과 보고를 넘어,</span>{' '}
              <span className="text-primary inline-block">다음 성장을 설계하는</span>{' '}
              <span className="inline-block">인사이트 리포트</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-prose mx-auto leading-relaxed break-keep">
              코리너스는 캠페인 종료 후 단순 수치 나열이 아닌, ROAS와 트래픽 데이터를 분석하여 브랜드의 향후 전략을 제시합니다.
            </p>
          </div>

          {/* Section 1: 핵심 분석 지표 */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 break-keep">
                단순 보고를 넘어 <span className="text-primary">성장을 설계하는 핵심 지표</span>
              </h3>
              <p className="text-muted-foreground break-keep">데이터 시각화 기반의 정밀한 성과 분석</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* 1) 성과 효율 - ROAS & CVR */}
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">성과 효율</h4>
                    <p className="text-xs text-muted-foreground">ROAS 및 주요 커머스 전환율</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {/* 분석 설명 */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">ROAS 및 구매 전환율(CVR) 분석:</span> 전체 캠페인 예산 대비 창출된 매출과 주요 커머스 채널(큐텐, 아마존 등) 내에서의 실질적인 전환 효율을 분석합니다.
                    </p>
                  </div>

                  {/* ROAS Metric */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">캠페인 ROAS</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-primary">450%</div>
                      <div className="text-sm text-primary/70 mb-1">+150% ↑</div>
                    </div>
                  </div>

                  {/* CVR Chart */}
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">주요 커머스 전환율 (CVR)</div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">큐텐 메가와리</span>
                        <span className="text-sm font-bold text-primary">8.5%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">아마존 프라임데이</span>
                        <span className="text-sm font-bold text-primary/80">7.2%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/80 rounded-full" style={{ width: '72%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">라쿠텐 슈퍼세일</span>
                        <span className="text-sm font-bold text-primary/60">6.8%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: '68%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 2) 유입 품질 */}
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">유입 품질</h4>
                    <p className="text-xs text-muted-foreground">타겟 체류시간 및 이탈률 분석</p>
                  </div>
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {/* 분석 설명 */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">유효 트래픽 및 도달 질 분석:</span> 단순 노출수(Reach)를 넘어, 브랜드 페이지로 유입된 타겟의 체류 시간 및 이탈 구간을 분석하여 콘텐츠의 소구력이 적절했는지 진단합니다.
                    </p>
                  </div>

                  {/* 체류시간 */}
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">평균 체류시간</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-primary">4m 32s</div>
                      <div className="text-sm text-primary/70 mb-1">+85% ↑</div>
                    </div>
                  </div>

                  {/* 구간별 이탈률 */}
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">구간별 이탈률</div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">랜딩 페이지</span>
                        <span className="text-sm font-bold text-red-400">28%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400/60 rounded-full" style={{ width: '28%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">상세 페이지</span>
                        <span className="text-sm font-bold text-orange-400">18%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400/60 rounded-full" style={{ width: '18%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-foreground">결제 페이지</span>
                        <span className="text-sm font-bold text-primary">8%</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '8%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4) 확산 가치 */}
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">확산 가치</h4>
                    <p className="text-xs text-muted-foreground">리마케팅 자산 가치 평가</p>
                  </div>
                  <Share2 className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {/* 분석 설명 */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">자산화 지표(저장 및 공유):</span> 단발성 시청이 아닌, 소비자가 브랜드를 '저장'하거나 '공유'한 수치를 통해 향후 리마케팅 자산으로서의 가치를 측정합니다.
                    </p>
                  </div>

                  {/* 저장 수 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Bookmark className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">저장</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">24.5K</div>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">공유</span>
                      </div>
                      <div className="text-2xl font-bold text-primary">18.2K</div>
                    </div>
                  </div>

                  {/* 리마케팅 가치 */}
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-2">예상 리마케팅 자산 가치</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-primary">¥8.2M</div>
                      <div className="text-sm text-muted-foreground mb-1">(약 ₩72M)</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>향후 6개월 재타겟팅 캠페인 활용 가능</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3) 정성 반응 */}
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">정성 반응</h4>
                    <p className="text-xs text-muted-foreground">구매의사 및 현지정서 키워드</p>
                  </div>
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {/* 분석 설명 */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-semibold text-primary">텍스트 마이닝 정성 분석:</span> 캠페인 참여 크리에이터들의 콘텐츠 댓글 내 '구매 의사', '브랜드 이미지'와 관련된 주요 키워드를 추출하여 현지 정서를 분석합니다.
                    </p>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>분석 데이터: 30만+ 댓글</span>
                    </div>
                    
                    {/* 구매 의사 키워드 */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">구매 의사</span>
                        <span>Top 5 키워드</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">구매함</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">재구매</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md">추천</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">만족</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">효과적</span>
                      </div>
                    </div>

                    {/* 브랜드 이미지 키워드 */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">브랜드 이미지</span>
                        <span>Top 5 키워드</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">신뢰감</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">프리미엄</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">혁신적</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md">품질</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">트렌디</span>
                      </div>
                    </div>

                    {/* 현지 정서 키워드 */}
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">현지 정서</span>
                        <span>일본 시장 반응</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">コスパ良い</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md">使いやすい</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">リピ決定</span>
                        <span className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-md shadow-[0_0_8px_rgba(0,255,255,0.3)]">買ってよかった</span>
                        <span className="px-3 py-1.5 bg-primary/15 border border-primary/20 text-primary text-xs font-semibold rounded-md">おすすめ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
