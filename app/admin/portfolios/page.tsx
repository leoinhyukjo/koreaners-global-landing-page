'use client'

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

  // 폼 상태
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
    // 카테고리는 첫 번째 값만 사용 (단일 선택)
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

    // 카테고리 값 검증: 4가지 값 중 하나만 허용
    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      alert('Beauty, F&B, Fashion, etc 중 하나를 선택해주세요.')
      return
    }

    try {
      setSaving(true)

      // 카테고리는 배열로 저장하되, 단일 값만 포함 (DB 스키마가 배열 타입인 경우 대비)
      const categoryArray = [category]

      const portfolioData = {
        title,
        client_name: clientName,
        thumbnail_url: thumbnailUrl || null,
        category: categoryArray,
        link: link || null,
        content: {}, // 나중에 BlockNote로 확장
      }

      if (editingPortfolio) {
        // 수정
        const { error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('id', editingPortfolio.id)

        if (error) throw error
        alert('포트폴리오가 수정되었습니다.')
      } else {
        // 생성
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">포트폴리오 관리</h1>
          <p className="text-muted-foreground">포트폴리오를 추가, 수정, 삭제할 수 있습니다</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          새 포트폴리오
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
        ) : portfolios.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            등록된 포트폴리오가 없습니다.
          </div>
        ) : (
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
                    <div className="flex gap-1 flex-wrap">
                      {portfolio.category && portfolio.category.length > 0 ? (
                        portfolio.category.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
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
                        size="icon-sm"
                        onClick={() => handleEdit(portfolio)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(portfolio.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="포트폴리오 제목"
              />
            </div>

            <div>
              <Label htmlFor="client">클라이언트명 *</Label>
              <Input
                id="client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="클라이언트명"
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">썸네일 URL</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="link">링크</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-2">
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

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : editingPortfolio ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
