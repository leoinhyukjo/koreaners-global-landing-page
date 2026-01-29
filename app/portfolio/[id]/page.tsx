'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import { Navigation } from '@/components/navigation'
import { MarketingCTA } from '@/components/common/marketing-cta'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

const PortfolioContentClient = dynamic(
  () => import('@/components/portfolio/portfolio-content-client').then((mod) => ({ default: mod.PortfolioContentClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-zinc-200">콘텐츠를 불러오는 중...</p>
      </div>
    ),
  }
)

export default function PortfolioDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [otherPortfolios, setOtherPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio()
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchOtherPortfolios()
  }, [id])

  async function fetchPortfolio() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPortfolio(data)
    } catch (error: any) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOtherPortfolios() {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setOtherPortfolios(data || [])
    } catch (error: any) {
      console.error('Error fetching other portfolios:', error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-zinc-900">
        <Navigation />
        <div className="container mx-auto max-w-4xl pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 text-center">
          <p className="text-zinc-200">로딩 중...</p>
        </div>
      </main>
    )
  }

  if (!portfolio) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-zinc-900">
        <Navigation />
        <div className="container mx-auto max-w-4xl pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 text-center">
          <p className="text-zinc-200 mb-6">포트폴리오를 찾을 수 없습니다.</p>
          <Link href="/portfolio">
            <Button variant="ghost" className="min-h-[44px] text-white hover:bg-zinc-800 border-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  const hasContent = portfolio.content && Array.isArray(portfolio.content) && portfolio.content.length > 0

  return (
    <main className="min-h-screen relative overflow-hidden bg-zinc-900">
      <Navigation />

      <article className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {/* 헤더 */}
          <header className="mb-8 sm:mb-12">
            <Link href="/portfolio">
              <Button variant="ghost" className="mb-4 sm:mb-6 min-h-[44px] break-keep text-white hover:bg-zinc-800 border-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </Link>

            <div className="space-y-4 sm:space-y-6">
              {/* Hero Image - 블로그와 동일하게 상단 배치 */}
              <div className="aspect-video rounded-none overflow-hidden border border-zinc-700/50 relative bg-zinc-800">
                {portfolio.thumbnail_url ? (
                  <img
                    src={portfolio.thumbnail_url}
                    alt={portfolio.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <div className="text-center px-4">
                      <div className="text-4xl mb-2">📁</div>
                      <p className="text-sm text-zinc-400">준비된 이미지가 없습니다</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 타이틀 섹션: 제목 + 제작 날짜만 */}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight break-keep text-white">
                  {portfolio.title}
                </h1>
                <time className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1.5 break-keep" dateTime={portfolio.created_at}>
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                </time>
              </div>
            </div>
          </header>

          {/* 제목과 본문 구분선 */}
          <div className="border-t border-zinc-700/50 mt-8 sm:mt-10 mb-8 sm:mb-10" />

          {/* 본문 - 블로그와 동일한 박스 + prose */}
          <div className="border border-zinc-700/50 bg-zinc-800 p-4 sm:p-6 md:p-8 lg:p-10 rounded-none blog-content-wrapper">
            {hasContent ? (
              <div className="prose prose-lg dark:prose-invert max-w-none break-keep text-zinc-200 leading-relaxed">
                <PortfolioContentClient portfolio={portfolio} />
              </div>
            ) : (
              <p className="text-zinc-400">콘텐츠가 없습니다.</p>
            )}
          </div>

          {/* 마케팅 문의 CTA */}
          <MarketingCTA />

          {/* 다른 포트폴리오 보기 - 블로그의 관련 게시글 영역 대체 */}
          {otherPortfolios.length > 0 && (
            <section className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-zinc-700/50">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">다른 포트폴리오 보기</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {otherPortfolios.map((item) => (
                  <Link key={item.id} href={`/portfolio/${item.id}`} className="block h-full">
                    <Card className="group overflow-hidden bg-zinc-800 border-zinc-700/50 hover:border-white transition-all duration-300 cursor-pointer h-full flex flex-col">
                      <div className="aspect-video relative overflow-hidden bg-zinc-800">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-zinc-600">
                              {item.category?.[0]?.charAt(0) ?? 'P'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-white group-hover:text-white transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">{item.client_name}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/portfolio">
                  <Button variant="outline" className="text-white border-zinc-600 hover:bg-zinc-800 hover:text-white rounded-none">
                    포트폴리오 전체 보기
                  </Button>
                </Link>
              </div>
            </section>
          )}
        </div>
      </article>
    </main>
  )
}
