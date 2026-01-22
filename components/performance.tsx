'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Sparkles, TrendingUp, Users2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import Link from 'next/link'

export function Performance() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
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
        .limit(6)

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 필터링
  const filteredPortfolios = activeFilter === 'all' 
    ? portfolios 
    : portfolios.filter(item => {
        if (!item.category || !Array.isArray(item.category)) return false
        return item.category.some(cat => 
          cat === activeFilter || 
          (activeFilter === 'F&B' && cat === 'F&B')
        )
      })

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'Beauty', label: 'Beauty' },
    { id: 'F&B', label: 'F&B' },
    { id: 'Fashion', label: 'Fashion' },
    { id: 'etc', label: 'etc' },
  ]

  const results = [
    {
      icon: Sparkles,
      category: 'Beauty',
      result: '매출 150% 성장',
      description: 'K-뷰티 브랜드 일본 진출 6개월 만에',
    },
    {
      icon: TrendingUp,
      category: 'Fashion',
      result: '점당 매출 150% 증가',
      description: '오프라인 팝업스토어 성공적 런칭',
    },
    {
      icon: Users2,
      category: 'F&B',
      result: '주간 2만 명 방문',
      description: '신제품 출시 이벤트 대성공',
    },
  ]

  return (
    <section id="performance" className="py-24 relative bg-card/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              <span className="text-foreground">검증된 </span>
              <span className="text-primary">성과</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              다양한 산업군에서 탁월한 결과를 만들어냈습니다
            </p>
            
            {/* Portfolio Filter Buttons */}
            <div className="flex gap-2 mb-12 justify-center flex-wrap">
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    activeFilter === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-card/80 border border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Cards */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : filteredPortfolios.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {portfolios.length === 0 
                  ? '등록된 포트폴리오가 없습니다.'
                  : '선택한 카테고리에 해당하는 포트폴리오가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredPortfolios.map(item => (
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
                            {item.category && item.category.length > 0 ? item.category[0] : 'etc'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl font-bold text-primary/20 uppercase">
                            {item.category && item.category.length > 0 
                              ? item.category[0].charAt(0) 
                              : 'E'}
                          </div>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase">
                            {item.category && item.category.length > 0 ? item.category[0] : 'etc'}
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

          {/* Legacy Results Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {results.map((result, index) => (
              <Card
                key={index}
                className="relative p-8 bg-card border-border hover:border-primary hover:shadow-[0_0_30px_rgba(217,255,0,0.2)] hover:-translate-y-2 transition-all duration-500 group text-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <result.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {result.category}
                  </div>
                  
                  <div className="text-3xl font-bold text-primary mb-4">
                    {result.result}
                  </div>
                  
                  <p className="text-foreground text-sm">
                    {result.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* View All Link */}
          {filteredPortfolios.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/portfolio">
                <button className="px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium">
                  전체 포트폴리오 보기
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
