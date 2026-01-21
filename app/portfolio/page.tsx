'use client'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { TrendingUp, Award, Target } from 'lucide-react'
import { FooterCTA } from '@/components/footer-cta' // Declare the FooterCTA variable

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('all')

  const portfolioItems = [
    { id: 1, category: 'beauty', title: 'K-Beauty 브랜드 A사', description: '신규 진입 3개월 만에 매출 목표 240% 달성', reach: '580만', engagement: '125개', conversion: '240%' },
    { id: 2, category: 'fashion', title: '패션 브랜드 B사', description: '일본 공식몰 론칭 후 첫 달 목표 매출 180% 달성', reach: '420만', engagement: '98개', conversion: '180%' },
    { id: 3, category: 'fb', title: 'F&B 브랜드 C사', description: '브랜드 인지도 제로에서 시작해 6개월 만에 주요 유통 입점', reach: '650만', engagement: '156개', conversion: '12개' },
    { id: 4, category: 'beauty', title: 'Skincare 브랜드 D사', description: '일본 시장 진출 첫 해 매출 3억 달성', reach: '380만', engagement: '89개', conversion: '195%' },
    { id: 5, category: 'fashion', title: 'K-Fashion 브랜드 E사', description: '일본 Z세대 타깃 SNS 캠페인으로 브랜드 인지도 급상승', reach: '520만', engagement: '143개', conversion: '220%' },
    { id: 6, category: 'fb', title: 'F&B 브랜드 F사', description: '일본 편의점 입점 성공 및 매출 2배 달성', reach: '490만', engagement: '112개', conversion: '8개' },
    { id: 7, category: 'etc', title: 'Lifestyle 브랜드 G사', description: '일본 크라우드펀딩 목표 금액 350% 달성', reach: '310만', engagement: '76개', conversion: '350%' },
    { id: 8, category: 'etc', title: 'Tech 브랜드 H사', description: '일본 온라인 커머스 런칭 성공', reach: '280만', engagement: '64개', conversion: '165%' },
  ]

  const filteredItems = activeTab === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeTab)

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'beauty', label: 'Beauty' },
    { id: 'fb', label: 'F&B' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'etc', label: 'Etc' },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              <span className="text-foreground">검증된 성과로 증명하는</span>
              <br />
              <span className="text-primary">일본 시장 전문성</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Beauty, Fashion, F&B 카테고리에서 일관되게 입증된 마케팅 성과
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-12 justify-center flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Portfolio Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {filteredItems.map(item => (
              <Card 
                key={item.id}
                className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer"
              >
                {/* Image Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl font-bold text-primary/20 uppercase">
                      {item.category === 'beauty' ? 'B' : item.category === 'fashion' ? 'F' : item.category === 'fb' ? 'F&B' : 'E'}
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                      {item.category === 'fb' ? 'F&B' : item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">리치</p>
                      <p className="text-sm font-bold text-primary">{item.reach}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">콘텐츠</p>
                      <p className="text-sm font-bold text-primary">{item.engagement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">성과</p>
                      <p className="text-sm font-bold text-primary">{item.conversion}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>
    </main>
  )
}
