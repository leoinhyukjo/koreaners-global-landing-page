'use client'

import { Navigation } from '@/components/navigation'
import { Users, Instagram, Twitter, Award, Target, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function CreatorPage() {
  const creators = [
    { id: 1, name: '韓国留学生momona', nameEn: 'Momona', category: 'Lifestyle', platforms: ['YT', 'IG', 'TT', 'X'], location: '한국 거주', followers: '285K', engagement: '9.2%' },
    { id: 2, name: 'マーキュリー商事', nameEn: 'Mercury', category: 'Business', platforms: ['YT', 'IG', 'TT', 'X'], location: '일본 거주', followers: '195K', engagement: '7.8%' },
    { id: 3, name: '丸岡えつこ', nameEn: 'Maruoka Etsuko', category: 'Lifestyle', platforms: ['YT', 'IG', 'TT', 'X'], location: '일본 거주', followers: '320K', engagement: '10.5%' },
    { id: 4, name: 'Kagawa Yu', nameEn: 'Kagawa Yu', category: 'Fashion', platforms: ['YT', 'IG', 'TT', 'X'], location: '한국 거주', followers: '410K', engagement: '11.2%' },
    { id: 5, name: 'Uchan', nameEn: 'Uchan', category: 'Beauty', platforms: ['YT', 'IG', 'TT', 'X'], location: '한국 거주', followers: '265K', engagement: '8.9%' },
    { id: 6, name: 'MAHO', nameEn: 'Maho', category: 'Fashion', platforms: ['YT', 'IG', 'TT', 'X'], location: '일본 거주', followers: '380K', engagement: '9.7%' },
    { id: 7, name: 'michan', nameEn: 'Michan', category: 'Beauty', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '225K', engagement: '10.1%' },
    { id: 8, name: 'えみん', nameEn: 'Emin', category: 'Lifestyle', platforms: ['YT', 'IG', 'TT'], location: '한국 거주', followers: '195K', engagement: '8.6%' },
    { id: 9, name: 'えの', nameEn: 'Eno', category: 'Fashion', platforms: ['YT', 'IG', 'TT', 'X'], location: '한국 거주', followers: '340K', engagement: '11.8%' },
    { id: 10, name: 'きむはな', nameEn: 'Kim Hana', category: 'Beauty', platforms: ['YT', 'IG'], location: '일본 거주', followers: '280K', engagement: '9.4%' },
    { id: 11, name: 'れいな', nameEn: 'Reina', category: 'Fashion', platforms: ['IG', 'TT'], location: '일본 거주', followers: '165K', engagement: '10.3%' },
    { id: 12, name: 'ムグン', nameEn: 'Mugun', category: 'Lifestyle', platforms: ['IG'], location: '한국 거주', followers: '145K', engagement: '7.9%' },
    { id: 13, name: 'ふかわ', nameEn: 'Fukawa', category: 'F&B', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '210K', engagement: '8.8%' },
    { id: 14, name: 'SONAMI', nameEn: 'Sonami', category: 'Beauty', platforms: ['YT', 'IG', 'TT', 'X'], location: '한국 거주', followers: '395K', engagement: '12.1%' },
    { id: 15, name: 'みじゅ', nameEn: 'Miju', category: 'Fashion', platforms: ['IG', 'X'], location: '일본 거주', followers: '175K', engagement: '9.6%' },
    { id: 16, name: 'AMANE', nameEn: 'Amane', category: 'Lifestyle', platforms: ['YT', 'IG', 'TT'], location: '한국 거주', followers: '305K', engagement: '10.9%' },
    { id: 17, name: 'SEIRA', nameEn: 'Seira', category: 'Beauty', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '425K', engagement: '13.2%' },
    { id: 18, name: 'Natsuki', nameEn: 'Natsuki', category: 'Fashion', platforms: ['IG', 'TT'], location: '일본 거주', followers: '190K', engagement: '8.7%' },
    { id: 19, name: 'hekihooo', nameEn: 'Hekiho', category: 'Lifestyle', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '255K', engagement: '9.3%' },
    { id: 20, name: 'NAGUMO FUKA', nameEn: 'Nagumo Fuka', category: 'Beauty', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '315K', engagement: '11.4%' },
    { id: 21, name: 'HIMARI', nameEn: 'Himari', category: 'Fashion', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '370K', engagement: '12.6%' },
    { id: 22, name: '加藤 乃愛', nameEn: 'Kato Noa', category: 'Beauty', platforms: ['YT', 'IG', 'TT', 'X'], location: '일본 거주', followers: '445K', engagement: '14.1%' },
    { id: 23, name: 'Mitsuki', nameEn: 'Mitsuki', category: 'Lifestyle', platforms: ['YT', 'IG', 'TT'], location: '일본 거주', followers: '295K', engagement: '10.2%' },
    { id: 24, name: 'Chisato Yoshiki', nameEn: 'Chiipopo', category: 'Beauty', platforms: ['YT', 'IG'], location: '일본 거주', followers: '335K', engagement: '11.7%' },
    { id: 25, name: 'myu', nameEn: 'Myu', category: 'Fashion', platforms: ['YT', 'IG'], location: '일본 거주', followers: '265K', engagement: '9.8%' },
  ]

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
            {creators.map(creator => (
              <Card 
                key={creator.id}
                className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300"
              >
                {/* Creator Avatar */}
                <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-20 h-20 text-primary/30" />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1">
                    {creator.platforms.map((platform, idx) => (
                      <div key={idx} className="p-1.5 bg-background/80 backdrop-blur-sm rounded-full">
                        {platform === 'IG' && <Instagram className="w-3 h-3 text-primary" />}
                        {platform === 'X' && <Twitter className="w-3 h-3 text-primary" />}
                        {platform === 'TT' && <span className="text-[10px] font-bold text-primary">TT</span>}
                        {platform === 'YT' && <span className="text-[10px] font-bold text-primary">YT</span>}
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
                        {creator.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {creator.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{creator.location}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Followers</p>
                      <p className="font-bold text-primary">{creator.followers}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                      <p className="font-bold text-primary">{creator.engagement}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

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
                    <span><span className="font-medium text-foreground">X (Twitter):</span> 정보 확산형 콘텐츠 특화</span>
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
