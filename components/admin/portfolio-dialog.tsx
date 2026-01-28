'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
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
import type { BlockNoteEditor } from '@blocknote/core'

const STORAGE_BUCKET = 'website-assets'

// BlockNote 에디터를 클라이언트 사이드에서만 로드
const PortfolioEditorWrapper = dynamic(
  () => import('./portfolio-editor-wrapper').then((mod) => ({ default: mod.PortfolioEditorWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg overflow-hidden bg-card min-h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">에디터 로딩 중...</p>
      </div>
    ),
  }
)

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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [editorContent, setEditorContent] = useState<any[]>([])
  const [initialEditorContent, setInitialEditorContent] = useState<any[] | undefined>(undefined)
  const editorRef = useRef<BlockNoteEditor | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (portfolio) {
      setTitle(portfolio.title)
      setClientName(portfolio.client_name)
      setThumbnailUrl(portfolio.thumbnail_url || '')
      // 카테고리는 첫 번째 값만 사용 (단일 선택)
      setCategory(portfolio.category && portfolio.category.length > 0 ? portfolio.category[0] : '')
      setLink(portfolio.link || '')
      setThumbnailFile(null)
      // BlockNote 에디터에 기존 콘텐츠 로드
      if (portfolio.content && Array.isArray(portfolio.content) && portfolio.content.length > 0) {
        setInitialEditorContent(portfolio.content)
      } else {
        setInitialEditorContent(undefined)
      }
    } else {
      // 새 포트폴리오인 경우 초기화
      setTitle('')
      setClientName('')
      setThumbnailUrl('')
      setCategory('')
      setLink('')
      setThumbnailFile(null)
      setInitialEditorContent(undefined)
    }
  }, [portfolio, open])

  async function uploadImage(file: File): Promise<string> {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `portfolios/${fileName}`

      console.log('1. 파일 업로드 시도:', fileName)
      console.log('[PortfolioDialog] 이미지 업로드 시작:', { fileName, filePath, fileSize: file.size })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('[PortfolioDialog] 업로드 에러:', uploadError)
        if (
          typeof uploadError.message === 'string' &&
          uploadError.message.toLowerCase().includes('bucket') &&
          uploadError.message.toLowerCase().includes('not found')
        ) {
          console.error(
            "Supabase Storage에 'website-assets' 버킷을 생성하고 Public으로 설정했는지 확인하세요"
          )
        }
        throw uploadError
      }

      console.log('[PortfolioDialog] 업로드 성공:', uploadData)

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

      console.log('2. 획득된 Public URL:', publicUrl)
      console.log('[PortfolioDialog] Public URL 생성:', publicUrl)

      if (!publicUrl || publicUrl.trim() === '') {
        console.error('[PortfolioDialog] Public URL이 비어있음!')
        throw new Error('이미지 URL을 생성할 수 없습니다.')
      }

      return publicUrl
    } catch (error: any) {
      console.error('[PortfolioDialog] 업로드 실패:', error)
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
      const content = editorRef.current?.document || editorContent
      // 카테고리는 배열로 저장하되, 단일 값만 포함 (DB 스키마가 배열 타입인 경우 대비)
      const categoryArray = [category]

      // Step 1: 업로드할 파일 확인
      const file = thumbnailFile
      console.log('Step 1: 업로드할 파일 확인 ->', file)

      // thumbnail_url 처리: 선택된 파일이 있으면 우선 업로드, 없으면 기존 URL 사용
      let finalThumbnailUrl: string | null = null

      if (file) {
        try {
          setUploading(true)
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`

          const filePath = `portfolios/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('[PortfolioDialog] 썸네일 업로드 에러:', uploadError)
            if (
              typeof uploadError.message === 'string' &&
              uploadError.message.toLowerCase().includes('bucket') &&
              uploadError.message.toLowerCase().includes('not found')
            ) {
              console.error(
                "Supabase Storage에 'website-assets' 버킷을 생성하고 Public으로 설정했는지 확인하세요"
              )
            }
            throw uploadError
          }

          console.log('[PortfolioDialog] 썸네일 업로드 성공:', uploadData)

          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

          console.log('Step 2: 생성된 Public URL ->', publicUrl)

          if (!publicUrl || publicUrl.trim() === '') {
            console.error('[PortfolioDialog] 썸네일 Public URL이 비어있음!')
            throw new Error('이미지 URL을 생성할 수 없습니다.')
          }

          finalThumbnailUrl = publicUrl
        } finally {
          setUploading(false)
        }
      } else if (thumbnailUrl && thumbnailUrl.trim()) {
        finalThumbnailUrl = thumbnailUrl.trim()
      }

      const finalPayload = {
        title,
        client_name: clientName,
        thumbnail_url: finalThumbnailUrl,
        hasThumbnail: !!finalThumbnailUrl,
        category: categoryArray,
        link: link || null,
        content,
      }

      console.log('Step 3: DB로 전송할 최종 Payload ->', finalPayload)

      if (portfolio) {
        // 수정
        const { error } = await supabase
          .from('portfolios')
          .update(finalPayload)
          .eq('id', portfolio.id)

        if (error) {
          console.error('[PortfolioDialog] 업데이트 에러:', error)
          throw error
        }

        console.log('[PortfolioDialog] 포트폴리오 수정 완료')
        toast({
          title: '성공',
          description: '포트폴리오가 수정되었습니다.',
        })
      } else {
        // 생성
        const { data, error } = await supabase.from('portfolios').insert(finalPayload).select()

        if (error) {
          console.error('[PortfolioDialog] 생성 에러:', error)
          throw error
        }

        console.log('[PortfolioDialog] 포트폴리오 생성 완료:', data)
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
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setThumbnailFile(file)
                    if (file) {
                      const previewUrl = URL.createObjectURL(file)
                      setThumbnailUrl(previewUrl)
                    } else {
                      setThumbnailUrl('')
                    }
                  }}
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
            <PortfolioEditorWrapper
              initialContent={initialEditorContent}
              onContentChange={(content) => {
                setEditorContent(content)
              }}
              uploadFile={uploadImage}
              onEditorReady={(editor) => {
                editorRef.current = editor
              }}
            />
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
