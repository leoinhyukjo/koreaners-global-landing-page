'use client'

import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolios()
  }, [])

  async function fetchPortfolios() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 필터링
  const filteredItems = activeTab === 'all' 
    ? portfolios 
    : portfolios.filter(item => {
        if (!item.category || !Array.isArray(item.category)) return false
        return item.category.some(cat => 
          cat.toLowerCase() === activeTab.toLowerCase() || 
          (activeTab === 'fb' && cat.toLowerCase() === 'f&b')
        )
      })

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'beauty', label: 'Beauty' },
    { id: 'fb', label: 'F&B' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'etc', label: 'Etc' },
  ]

  // 카테고리 표시용 함수
  function getCategoryDisplay(category: string[] | null): string {
    if (!category || category.length === 0) return 'Etc'
    return category[0]
  }

  // 카테고리 첫 글자 가져오기
  function getCategoryInitial(category: string[] | null): string {
    if (!category || category.length === 0) return 'E'
    const firstCat = category[0].toLowerCase()
    if (firstCat === 'beauty') return 'B'
    if (firstCat === 'fashion') return 'F'
    if (firstCat === 'f&b' || firstCat === 'fb') return 'F&B'
    return 'E'
  }

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
          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {portfolios.length === 0 
                  ? '등록된 포트폴리오가 없습니다.'
                  : '선택한 카테고리에 해당하는 포트폴리오가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {filteredItems.map(item => (
                <Link key={item.id} href={`/portfolio/${item.id}`}>
                  <Card 
                    className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer h-full"
                  >
                    {/* Image */}
                    {item.thumbnail_url ? (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                            {getCategoryDisplay(item.category)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl font-bold text-primary/20 uppercase">
                            {getCategoryInitial(item.category)}
                          </div>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                            {getCategoryDisplay(item.category)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {item.client_name}
                      </p>

                      {/* Category Tags */}
                      {item.category && item.category.length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-4 border-t border-border">
                          {item.category.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
