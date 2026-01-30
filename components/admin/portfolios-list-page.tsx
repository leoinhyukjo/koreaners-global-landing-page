'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'

export function PortfoliosListPage() {
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
      alert('포트폴리오를 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase.from('portfolios').delete().eq('id', id)

      if (error) throw error
      alert('포트폴리오가 삭제되었습니다.')
      fetchPortfolios()
    } catch (error: any) {
      console.error('Error deleting portfolio:', error)
      alert('삭제에 실패했습니다: ' + error.message)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">포트폴리오 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            포트폴리오를 추가, 수정, 삭제할 수 있습니다
          </p>
        </div>
        <Button asChild className="h-11 shrink-0 px-5 sm:h-10">
          <Link href="/admin/portfolios/new">
            <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
            <span className="sm:inline">새 포트폴리오</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">
          로딩 중...
        </Card>
      ) : portfolios.length === 0 ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">
          등록된 포트폴리오가 없습니다.
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>클라이언트</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolios.map((portfolio) => (
                    <TableRow key={portfolio.id}>
                      <TableCell className="font-medium">{portfolio.title}</TableCell>
                      <TableCell>{portfolio.client_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {portfolio.category?.map((cat) => (
                            <span key={cat} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/portfolios/${portfolio.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(portfolio.id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <div className="space-y-4 md:hidden">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id} className="rounded-lg border shadow-sm p-6">
                <h3 className="font-semibold">{portfolio.title}</h3>
                <p className="text-sm text-muted-foreground">{portfolio.client_name}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/portfolios/${portfolio.id}`}>수정</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(portfolio.id)}
                    className="text-destructive"
                  >
                    삭제
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
