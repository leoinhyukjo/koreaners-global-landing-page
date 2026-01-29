'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NextDynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, X, Save } from 'lucide-react'
import type { BlockNoteEditor } from '@blocknote/core'

const STORAGE_BUCKET = 'website-assets'

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

interface PortfolioEditFormProps {
  portfolioId: string | null
}

export function PortfolioEditForm({ portfolioId }: PortfolioEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [category, setCategory] = useState<string>('')
  const [link, setLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!portfolioId)
  const [editorContent, setEditorContent] = useState<any[]>([])
  const [initialEditorContent, setInitialEditorContent] = useState<any[] | undefined>(undefined)
  const editorRef = useRef<BlockNoteEditor | null>(null)

  useEffect(() => {
    if (portfolioId) {
      loadPortfolio()
    }
  }, [portfolioId])

  async function loadPortfolio() {
    if (!portfolioId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single()

      if (error) throw error
      if (data) {
        setTitle(data.title || '')
        setClientName(data.client_name || '')
        setThumbnailUrl(data.thumbnail_url || '')
        setCategory(data.category?.[0] || '')
        setLink(data.link || '')
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
          setInitialEditorContent(data.content)
        } else {
          setInitialEditorContent(undefined)
        }
      }
    } catch (err: any) {
      console.error('Error loading portfolio:', err)
      toast({
        title: '로딩 실패',
        description: err.message || '포트폴리오를 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
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

      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
      if (!publicUrl) throw new Error('이미지 URL을 생성할 수 없습니다.')
      return publicUrl
    } catch (err: any) {
      toast({
        title: '업로드 실패',
        description: err.message || '이미지 업로드에 실패했습니다.',
        variant: 'destructive',
      })
      throw err
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!title?.trim()) {
      toast({
        title: '필수 항목',
        description: '제목을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    if (!clientName?.trim()) {
      toast({
        title: '필수 항목',
        description: '클라이언트명을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    if (!category) {
      toast({
        title: '필수 항목',
        description: '카테고리를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const content = editorRef.current?.document ?? editorContent
      const portfolioData = {
        title: title.trim(),
        client_name: clientName.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        category: [category],
        link: link.trim() || null,
        content: content ?? [],
      }

      if (portfolioId) {
        const { error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('id', portfolioId)

        if (error) throw error
        toast({ title: '저장 완료', description: '포트폴리오가 수정되었습니다.' })
      } else {
        const { error } = await supabase.from('portfolios').insert(portfolioData)
        if (error) throw error
        toast({ title: '저장 완료', description: '포트폴리오가 생성되었습니다.' })
      }
      router.push('/admin/portfolios')
      router.refresh()
    } catch (err: any) {
      console.error('Error saving portfolio:', err)
      toast({
        title: '저장 실패',
        description: err.message || '저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading && portfolioId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto max-w-7xl px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => router.push('/admin/portfolios')}
                aria-label="목록으로"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="truncate text-xl font-bold sm:text-2xl">
                {portfolioId ? '포트폴리오 수정' : '새 포트폴리오'}
              </h1>
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploading}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Save className="h-4 w-4 shrink-0 sm:mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-6 lg:col-span-1">
            <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="mt-1 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">클라이언트명 *</Label>
                <Input
                  id="client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="클라이언트명"
                  className="mt-1 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="mt-1 w-full">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">링크</Label>
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>썸네일 이미지</Label>
                <div className="mt-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const url = await uploadImage(file)
                        setThumbnailUrl(url)
                        toast({ title: '업로드 완료', description: '썸네일이 업로드되었습니다.' })
                      } catch {}
                    }}
                    disabled={uploading}
                    className="w-full"
                  />
                  {thumbnailUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                      <img src={thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-white hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
              <Label>본문 내용</Label>
              <PortfolioEditorWrapper
                initialContent={initialEditorContent}
                onContentChange={setEditorContent}
                uploadFile={uploadImage}
                onEditorReady={(editor) => { editorRef.current = editor }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
