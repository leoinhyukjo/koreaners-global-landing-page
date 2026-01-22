'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Users, Instagram, Youtube, Music, Award, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import type { Creator } from '@/lib/supabase'

export default function CreatorPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreators()
  }, [])

  async function fetchCreators() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCreators(data || [])
    } catch (error: any) {
      console.error('Error fetching creators:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              <span className="text-primary">105명의 전속 크리에이터</span>
              <br />
              <span className="text-foreground">검증된 전환 파워</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              일본 Z세대 67%의 구매 결정을 이끌어내는 실질적인 전환 엔진
            </p>
          </div>

          {/* Creator Cards Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">등록된 크리에이터가 없습니다.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
              {creators.map(creator => (
                <Card 
                  key={creator.id}
                  className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300"
                >
                  {/* Creator Avatar */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                    {/* 프로필 이미지 */}
                    {creator.profile_image_url ? (
                      <img
                        src={creator.profile_image_url}
                        alt={creator.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-20 h-20 text-primary/30" />
                      </div>
                    )}
                  </div>

                  {/* Creator Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {creator.name}
                    </h3>
                    
                    {/* SNS 링크 */}
                    <div className="flex gap-3">
                      {creator.instagram_url ? (
                        <a
                          href={creator.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-muted/50 opacity-30 pointer-events-none">
                          <Instagram className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      
                      {creator.youtube_url ? (
                        <a
                          href={creator.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          aria-label="YouTube"
                        >
                          <Youtube className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-muted/50 opacity-30 pointer-events-none">
                          <Youtube className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      
                      {creator.tiktok_url ? (
                        <a
                          href={creator.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          aria-label="TikTok"
                        >
                          <Music className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="p-2 rounded-full bg-muted/50 opacity-30 pointer-events-none">
                          <Music className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Creator Categories */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-foreground">타깃별 최적화된 </span>
              <span className="text-primary">크리에이터 풀</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300">
                <h3 className="text-2xl font-bold text-foreground mb-4">플랫폼별 전문성</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">Instagram:</span> 비주얼 중심 뷰티/패션 카테고리 전문</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">TikTok:</span> Z세대 타깃 숏폼 바이럴 전문가</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">YouTube:</span> 롱폼 리뷰 및 언박싱 콘텐츠</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300">
                <h3 className="text-2xl font-bold text-foreground mb-4">성별·연령별 세분화</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">10대 여성:</span> K-뷰티, K-패션 트렌드 리더</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">20대 여성:</span> 라이프스타일, 웰니스 인플루언서</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">30대 여성:</span> 프리미엄 뷰티, 육아 카테고리</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><span className="font-medium text-foreground">남성 크리에이터:</span> 테크, F&B, 라이프스타일</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Why Our Creators */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-primary">코리너스 크리에이터</span>
              <span className="text-foreground">만의 차별점</span>
            </h2>

            <div className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-border">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-3">전속 계약으로 보장되는 품질</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      일회성 협업이 아닌 전속 계약으로 브랜드 이해도가 높고, 가이드라인 준수율이 높은 안정적인 콘텐츠 생산이 가능합니다. 노쇼(No-show) 리스크가 없으며, 즉각적인 대체 인력 투입이 가능합니다.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-border">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-3">설명력 있는 콘텐츠 제작</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      단순히 예쁜 비주얼이 아닌, 일본 소비자가 궁금해하는 포인트를 정확히 짚어내는 '설명력 있는 콘텐츠'를 생산합니다. 이는 일본 Z세대의 구매 결정 요인 1위(29.5%)로, 인지에서 전환까지 직접 연결되는 핵심 요소입니다.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-border">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-3">현지화된 콘텐츠 감각</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      일본 소비자가 느끼는 '위화감(違和感)'을 완벽히 제거한 콘텐츠를 제작합니다. 한국식 소구점을 그대로 적용하는 것이 아니라, 일본 특유의 신중한 구매 패턴과 SNS 문법을 완벽히 이해하고 반영합니다.
                    </p>
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
