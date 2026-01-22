'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/react'
import '@blocknote/react/style.css'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'
import { Navigation } from '@/components/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function PortfolioDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)

  const editor = useCreateBlockNote({
    editable: false, // 읽기 전용
  })

  useEffect(() => {
    fetchPortfolio()
  }, [id])

  useEffect(() => {
    if (portfolio?.content && Array.isArray(portfolio.content) && editor && portfolio.content.length > 0) {
      try {
        editor.replaceBlocks(editor.document, portfolio.content)
      } catch (error) {
        console.error('Error loading BlockNote content:', error)
      }
    }
  }, [portfolio, editor])

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

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </main>
    )
  }

  if (!portfolio) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-muted-foreground">포트폴리오를 찾을 수 없습니다.</p>
          <Link href="/portfolio">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* 헤더 */}
          <div className="mb-8">
            <Link href="/portfolio">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로
              </Button>
            </Link>
            
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{portfolio.title}</h1>
                <p className="text-xl text-muted-foreground">{portfolio.client_name}</p>
              </div>

              {portfolio.thumbnail_url && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={portfolio.thumbnail_url}
                    alt={portfolio.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                {portfolio.category && portfolio.category.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {portfolio.category.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                
                {portfolio.link && (
                  <a
                    href={portfolio.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    프로젝트 링크
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 본문 */}
          <Card className="p-8">
            {portfolio?.content && Array.isArray(portfolio.content) && portfolio.content.length > 0 ? (
              <BlockNoteView editor={editor} />
            ) : (
              <p className="text-muted-foreground">콘텐츠가 없습니다.</p>
            )}
          </Card>
        </div>
      </section>
    </main>
  )
}
