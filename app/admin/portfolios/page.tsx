'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import type { Portfolio } from '@/lib/supabase'

const CATEGORIES = ['Beauty', 'F&B', 'Fashion', 'etc'] as const

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [category, setCategory] = useState<string>('')
  const [link, setLink] = useState('')

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

  function handleCreate() {
    setEditingPortfolio(null)
    resetForm()
    setDialogOpen(true)
  }

  function handleEdit(portfolio: Portfolio) {
    setEditingPortfolio(portfolio)
    setTitle(portfolio.title)
    setClientName(portfolio.client_name)
    setThumbnailUrl(portfolio.thumbnail_url || '')
    setCategory(portfolio.category && portfolio.category.length > 0 ? portfolio.category[0] : '')
    setLink(portfolio.link || '')
    setDialogOpen(true)
  }

  function resetForm() {
    setTitle('')
    setClientName('')
    setThumbnailUrl('')
    setCategory('')
    setLink('')
  }

  async function handleSave() {
    if (!title || !clientName) {
      alert('제목과 클라이언트명을 입력해주세요.')
      return
    }

    if (!category) {
      alert('카테고리를 선택해주세요.')
      return
    }

    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      alert('Beauty, F&B, Fashion, etc 중 하나를 선택해주세요.')
      return
    }

    try {
      setSaving(true)
      const categoryArray = [category]
      const portfolioData = {
        title,
        client_name: clientName,
        thumbnail_url: thumbnailUrl || null,
        category: categoryArray,
        link: link || null,
        content: {},
      }

      console.log('3. DB에 저장될 최종 객체:', portfolioData)

      if (editingPortfolio) {
        const { error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('id', editingPortfolio.id)
        if (error) throw error
        alert('포트폴리오가 수정되었습니다.')
      } else {
        const { error } = await supabase.from('portfolios').insert(portfolioData)
        if (error) throw error
        alert('포트폴리오가 생성되었습니다.')
      }

      setDialogOpen(false)
      resetForm()
      fetchPortfolios()
    } catch (error: any) {
      console.error('Error saving portfolio:', error)
      alert('저장에 실패했습니다: ' + error.message)
    } finally {
      setSaving(false)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">포트폴리오 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            포트폴리오를 추가, 수정, 삭제할 수 있습니다
          </p>
        </div>
        <Button onClick={handleCreate} className="h-11 shrink-0 px-5 sm:h-10">
          <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
          <span className="sm:inline">새 포트폴리오</span>
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : portfolios.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          등록된 포트폴리오가 없습니다.
        </Card>
      ) : (
        <>
          {/* 데스크톱: 테이블 */}
          <div className="hidden md:block">
            <Card>
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
                        <div className="flex flex-wrap gap-1">
                          {portfolio.category && portfolio.category.length > 0 ? (
                            portfolio.category.map((cat) => (
                              <span
                                key={cat}
                                className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleEdit(portfolio)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(portfolio.id)}
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

          {/* 모바일: 카드 리스트 */}
          <div className="space-y-4 md:hidden">
            {portfolios.map((portfolio) => (
              <Card
                key={portfolio.id}
                className="overflow-hidden border-border transition-colors hover:border-primary/30"
              >
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold leading-snug">{portfolio.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{portfolio.client_name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {portfolio.category && portfolio.category.length > 0 ? (
                      portfolio.category.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        >
                          {cat}
                        </span>
                      ))
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(portfolio)}
                      className="min-h-[44px] flex-1 gap-2 touch-manipulation"
                    >
                      <Edit className="h-4 w-4 shrink-0" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(portfolio.id)}
                      className="min-h-[44px] flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={[
            'overflow-y-auto',
            'h-[100dvh] w-full max-h-none max-w-none rounded-none border-0 p-4',
            'inset-0 top-0 left-0 translate-x-0 translate-y-0',
            'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-auto md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border md:p-6',
          ].join(' ')}
        >
          <DialogHeader>
            <DialogTitle>
              {editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="포트폴리오 제목"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">클라이언트명 *</Label>
              <Input
                id="client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="클라이언트명"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">썸네일 URL</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">링크</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                취소
              </Button>
              <Button onClick={handleSave} disabled={saving} className="w-full min-h-[44px] sm:w-auto sm:min-h-0 touch-manipulation">
                {saving ? '저장 중...' : editingPortfolio ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
