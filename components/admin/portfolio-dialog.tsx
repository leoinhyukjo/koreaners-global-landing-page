'use client'

import { useState, useEffect } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { Upload, X } from 'lucide-react'

interface PortfolioDialogProps {
  open: boolean
  onClose: () => void
  portfolio: Portfolio | null
}

const CATEGORIES = ['Beauty', 'F&B', 'Fashion', 'etc'] as const

export function PortfolioDialog({ open, onClose, portfolio }: PortfolioDialogProps) {
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [category, setCategory] = useState<string>('')
  const [link, setLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // BlockNote 에디터 초기화
  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      // 이미지 업로드 함수
      return await uploadImage(file)
    },
  })

  useEffect(() => {
    if (portfolio) {
      setTitle(portfolio.title)
      setClientName(portfolio.client_name)
      setThumbnailUrl(portfolio.thumbnail_url || '')
      // 카테고리는 첫 번째 값만 사용 (단일 선택)
      setCategory(portfolio.category && portfolio.category.length > 0 ? portfolio.category[0] : '')
      setLink(portfolio.link || '')
      // BlockNote 에디터에 기존 콘텐츠 로드
      if (portfolio.content && Array.isArray(portfolio.content) && editor && portfolio.content.length > 0) {
        try {
          editor.replaceBlocks(editor.document, portfolio.content)
        } catch (error) {
          console.error('Error loading BlockNote content:', error)
        }
      }
    } else {
      // 새 포트폴리오인 경우 초기화
      setTitle('')
      setClientName('')
      setThumbnailUrl('')
      setCategory('')
      setLink('')
      // 빈 문서로 초기화
      if (editor) {
        try {
          editor.replaceBlocks(editor.document, [
            {
              type: 'paragraph',
              content: '',
            },
          ])
        } catch (error) {
          console.error('Error initializing BlockNote editor:', error)
        }
      }
    }
  }, [portfolio, open, editor])

  async function uploadImage(file: File): Promise<string> {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('uploads').getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      toast({
        title: '업로드 실패',
        description: error.message || '이미지 업로드에 실패했습니다.',
        variant: 'destructive',
      })
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
      toast({
        title: '성공',
        description: '썸네일이 업로드되었습니다.',
      })
    } catch (error) {
      // 에러는 uploadImage에서 처리됨
    }
  }


  async function handleSubmit() {
    if (!title || !clientName) {
      toast({
        title: '필수 항목',
        description: '제목과 클라이언트명을 입력해주세요.',
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

    // 카테고리 값 검증: 4가지 값 중 하나만 허용
    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      toast({
        title: '유효하지 않은 카테고리',
        description: 'Beauty, F&B, Fashion, etc 중 하나를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      const content = editor.document
      // 카테고리는 배열로 저장하되, 단일 값만 포함 (DB 스키마가 배열 타입인 경우 대비)
      const categoryArray = [category]

      if (portfolio) {
        // 수정
        const { error } = await supabase
          .from('portfolios')
          .update({
            title,
            client_name: clientName,
            thumbnail_url: thumbnailUrl || null,
            category: categoryArray,
            link: link || null,
            content,
          })
          .eq('id', portfolio.id)

        if (error) throw error

        toast({
          title: '성공',
          description: '포트폴리오가 수정되었습니다.',
        })
      } else {
        // 생성
        const { error } = await supabase.from('portfolios').insert({
          title,
          client_name: clientName,
          thumbnail_url: thumbnailUrl || null,
          category: categoryArray,
          link: link || null,
          content,
        })

        if (error) throw error

        toast({
          title: '성공',
          description: '포트폴리오가 생성되었습니다.',
        })
      }

      onClose()
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const dialogContentClass = [
    'overflow-y-auto',
    'h-[100dvh] w-full max-h-none max-w-none rounded-none border-0 p-4',
    'inset-0 top-0 left-0 translate-x-0 translate-y-0',
    'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-auto md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border md:p-6',
  ].join(' ')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle>
            {portfolio ? '포트폴리오 수정' : '새 포트폴리오'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
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
              <Label>썸네일 이미지</Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploading}
                  className="w-full flex-1"
                />
                {thumbnailUrl && (
                  <div className="relative h-20 w-20 shrink-0">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      className="h-full w-full rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                      aria-label="썸네일 제거"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-1 w-full">
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
          </div>

          <div className="space-y-2">
            <Label>본문 내용</Label>
            <div className="mt-1 rounded-md border">
              <BlockNoteView editor={editor} />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              {portfolio ? '수정' : '생성'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
