'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import NextDynamic from 'next/dynamic'
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
import type { BlockNoteEditor } from '@blocknote/core'

const STORAGE_BUCKET = 'website-assets'

// BlockNote 에디터를 클라이언트 사이드에서만 로드
const PortfolioEditorWrapper = NextDynamic(
  () => import('@/components/admin/portfolio-editor-wrapper').then((mod) => ({ default: mod.PortfolioEditorWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg overflow-hidden bg-card min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">에디터 로딩 중...</p>
      </div>
    ),
  }
)

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
  const [uploading, setUploading] = useState(false)
  const [editorContent, setEditorContent] = useState<any[]>([])
  const [initialEditorContent, setInitialEditorContent] = useState<any[] | undefined>(undefined)
  const editorRef = useRef<BlockNoteEditor | null>(null)

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

  function handleEdit(portfolio: any) {
    setEditingPortfolio(portfolio)
    setTitle(portfolio.title)
    setClientName(portfolio.client_name)
    setThumbnailUrl(portfolio.thumbnail_url || '')
    setCategory(portfolio.category && portfolio.category.length > 0 ? portfolio.category[0] : '')
    setLink(portfolio.link || '')
    
    if (portfolio.content && Array.isArray(portfolio.content) && portfolio.content.length > 0) {
      setInitialEditorContent(portfolio.content)
    } else {
      setInitialEditorContent(undefined)
    }
    
    setDialogOpen(true)
  }

  function resetForm() {
    setTitle('')
    setClientName('')
    setThumbnailUrl('')
    setCategory('')
    setLink('')
    setInitialEditorContent(undefined)
    setEditorContent([])
  }

  async function uploadImage(file: File): Promise<string> {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `portfolios/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

      if (!publicUrl) throw new Error('이미지 URL을 생성할 수 없습니다.')

      return publicUrl
    } catch (error: any) {
      alert('이미지 업로드에 실패했습니다: ' + error.message)
      throw error
    } finally {
      setUploading(false)
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadImage(file)
      setThumbnailUrl(url)
      alert('썸네일 이미지가 업로드되었습니다.')
    } catch {
      // 에러는 uploadImage에서 처리됨
    }
  }

  async function handleSave() {
    if (!title || !clientName || !category) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      const categoryArray = [category]
      const content = editorRef.current?.document || editorContent
      const portfolioData = {
        title,
        client_name: clientName,
        thumbnail_url: thumbnailUrl || null,
        category: categoryArray,
        link: link || null,
        content: content,
      }

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
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(portfolio)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(portfolio.id)} className="text-destructive">
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
              <Card key={portfolio.id} className="p-4">
                <h3 className="font-semibold">{portfolio.title}</h3>
                <p className="text-sm text-muted-foreground">{portfolio.client_name}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(portfolio)}>수정</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(portfolio.id)} className="text-destructive">삭제</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">클라이언트명 *</Label>
                <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="클라이언트명" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>카테고리 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>링크</Label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>썸네일 이미지</Label>
              <div className="flex items-center gap-4">
                <Input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
                {thumbnailUrl && <img src={thumbnailUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>본문 내용 (에디터)</Label>
              <PortfolioEditorWrapper
                initialContent={initialEditorContent}
                onContentChange={setEditorContent}
                uploadFile={uploadImage}
                onEditorReady={(editor) => (editorRef.current = editor)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving ? '저장 중...' : editingPortfolio ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
