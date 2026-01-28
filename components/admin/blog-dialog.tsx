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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import { resolveThumbnailSrc } from '@/lib/thumbnail'
import type { BlockNoteEditor } from '@blocknote/core'

const STORAGE_BUCKET = 'website-assets'

// BlockNote 에디터를 클라이언트 사이드에서만 로드
const BlogEditorWrapper = dynamic(
  () => import('./blog-editor-wrapper').then((mod) => ({ default: mod.BlogEditorWrapper })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg overflow-hidden bg-card min-h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">에디터 로딩 중...</p>
      </div>
    ),
  }
)

interface BlogDialogProps {
  open: boolean
  onClose: () => void
  blogPost: BlogPost | null
}

const CATEGORIES = ['업계 동향', '최신 트렌드', '전문가 인사이트', '마케팅 뉴스'] as const

export function BlogDialog({ open, onClose, blogPost }: BlogDialogProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState<string>('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [published, setPublished] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [editorContent, setEditorContent] = useState<any[]>([])
  const [initialEditorContent, setInitialEditorContent] = useState<any[] | undefined>(undefined)
  const editorRef = useRef<BlockNoteEditor | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (blogPost) {
      setTitle(blogPost.title)
      setSlug(blogPost.slug)
      setCategory(blogPost.category)
      setThumbnailUrl(blogPost.thumbnail_url || '')
      setSummary(blogPost.summary || '')
      setPublished(blogPost.published || false)
      setMetaTitle(blogPost.meta_title || '')
      setMetaDescription(blogPost.meta_description || '')
      setThumbnailFile(null)
      if (blogPost.content && Array.isArray(blogPost.content) && blogPost.content.length > 0) {
        setInitialEditorContent(blogPost.content)
      } else {
        setInitialEditorContent(undefined)
      }
    } else {
      setTitle('')
      setSlug('')
      setCategory('')
      setThumbnailUrl('')
      setSummary('')
      setPublished(false)
      setMetaTitle('')
      setMetaDescription('')
      setThumbnailFile(null)
      setInitialEditorContent(undefined)
    }
  }, [blogPost, open])

  // 제목에서 슬러그 자동 생성
  useEffect(() => {
    if (!blogPost && title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(autoSlug)
    }
  }, [title, blogPost])

  async function uploadImage(file: File): Promise<string> {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `blog/${fileName}`

      console.log('1. 파일 업로드 시도:', fileName)
      console.log('[BlogDialog] 이미지 업로드 시작:', { fileName, filePath, fileSize: file.size })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('[BlogDialog] 업로드 에러:', uploadError)
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

      console.log('[BlogDialog] 업로드 성공:', uploadData)

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

      console.log('2. 획득된 Public URL:', publicUrl)
      console.log('[BlogDialog] Public URL 생성:', publicUrl)

      if (!publicUrl || publicUrl.trim() === '') {
        console.error('[BlogDialog] Public URL이 비어있음!')
        throw new Error('이미지 URL을 생성할 수 없습니다.')
      }

      return publicUrl
    } catch (err: any) {
      console.error('[BlogDialog] 업로드 실패:', err)
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

  async function handleSubmit(publish: boolean) {
    // 이미 저장 중이면 중복 실행 방지
    if (saving) {
      return
    }

    // 필수 필드 검증
    if (!title || !title.trim()) {
      toast({
        title: '필수 항목 누락',
        description: '제목을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!slug || !slug.trim()) {
      toast({
        title: '필수 항목 누락',
        description: '슬러그를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 슬러그 형식 검증 (영문, 숫자, 하이픈만 허용)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast({
        title: '슬러그 형식 오류',
        description: '슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.',
        variant: 'destructive',
      })
      return
    }

    if (!category) {
      toast({
        title: '필수 항목 누락',
        description: '카테고리를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 카테고리 값 검증
    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      toast({
        title: '유효하지 않은 카테고리',
        description: '업계 동향, 최신 트렌드, 전문가 인사이트, 마케팅 뉴스 중 하나를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 본문 내용 검증
    const content = editorRef.current?.document || editorContent
    if (!content || !Array.isArray(content) || content.length === 0) {
      toast({
        title: '필수 항목 누락',
        description: '본문 내용을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 발행 시 SEO 필드 필수
    if (publish) {
      if (!metaTitle || !metaTitle.trim()) {
        toast({
          title: 'SEO 필수 항목',
          description: '발행하려면 검색 엔진용 제목(Meta Title)을 입력해주세요.',
          variant: 'destructive',
        })
        return
      }
      if (!metaDescription || !metaDescription.trim()) {
        toast({
          title: 'SEO 필수 항목',
          description: '발행하려면 검색 결과 요약문(Meta Description)을 입력해주세요.',
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)
    try {
      // summary / meta 필드 안전 처리
      const safeSummary = summary && summary.trim() ? summary.trim() : null
      const safeMetaTitle = metaTitle && metaTitle.trim() ? metaTitle.trim() : null
      const safeMetaDescription = metaDescription && metaDescription.trim()
        ? metaDescription.trim()
        : null

      // Step 1: 업로드할 파일 확인
      const file = thumbnailFile
      console.log('Step 1: 업로드할 파일 확인 ->', file)

      // thumbnail_url 처리: 선택된 파일이 있으면 우선 업로드, 없으면 기존 URL 정규화
      let finalThumbnailUrl: string | null = null

      if (file) {
        try {
          setUploading(true)
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`
          const filePath = `blog/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('[BlogDialog] 썸네일 업로드 에러:', uploadError)
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

          console.log('[BlogDialog] 썸네일 업로드 성공:', uploadData)

          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

          console.log('Step 2: 생성된 Public URL ->', publicUrl)

          if (!publicUrl || publicUrl.trim() === '') {
            console.error('[BlogDialog] 썸네일 Public URL이 비어있음!')
            throw new Error('이미지 URL을 생성할 수 없습니다.')
          }

          finalThumbnailUrl = publicUrl
        } finally {
          setUploading(false)
        }
      } else if (thumbnailUrl && thumbnailUrl.trim()) {
        const trimmedUrl = thumbnailUrl.trim()
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
          finalThumbnailUrl = trimmedUrl
        } else {
          finalThumbnailUrl = resolveThumbnailSrc(trimmedUrl)
        }
      }

      const finalPayload = {
        title: title.trim(),
        slug: slug.trim(),
        category,
        thumbnail_url: finalThumbnailUrl,
        summary: safeSummary,
        content,
        published: publish,
        meta_title: safeMetaTitle,
        meta_description: safeMetaDescription,
      }

      console.log('Step 3: DB로 전송할 최종 Payload ->', finalPayload)

      if (blogPost) {
        // 수정
        const { error } = await supabase
          .from('blog_posts')
          .update({
            ...finalPayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', blogPost.id)

        if (error) {
          console.error('[BlogDialog] 업데이트 실패:', error.message || '알 수 없는 에러')
          throw error
        }

        toast({
          title: '저장 완료',
          description: publish ? '인사이트가 성공적으로 발행되었습니다.' : '인사이트가 임시저장되었습니다.',
        })
      } else {
        // 생성
        const { data, error } = await supabase.from('blog_posts').insert(finalPayload).select()

        if (error) {
          console.error('[BlogDialog] 생성 실패:', error.message || '알 수 없는 에러')
          throw error
        }

        if (!data || data.length === 0) {
          throw new Error('데이터가 저장되지 않았습니다.')
        }

        toast({
          title: '저장 완료',
          description: publish ? '인사이트가 성공적으로 발행되었습니다.' : '인사이트가 임시저장되었습니다.',
        })
      }

      onClose()
    } catch (err: any) {
      const errorMessage = err?.message || '저장에 실패했습니다. 필수 필드를 확인해주세요.'
      console.error('[BlogDialog] 저장 실패:', errorMessage)
      toast({
        title: '발행 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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
            {blogPost ? '마케팅 인사이트 수정' : '새 마케팅 인사이트'}
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
                placeholder="블로그 포스트 제목"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">슬러그 (URL) *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setSlug(value)
                }}
                placeholder="global-marketing-insights-2024"
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                URL에 사용될 고유한 식별자입니다. 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
              </p>
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

            <div className="space-y-2">
              <Label htmlFor="summary">요약</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="블로그 포스트 요약 문구"
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
                      src={resolveThumbnailSrc(thumbnailUrl)}
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
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">SEO 설정</h3>
            <div className="space-y-2">
              <Label htmlFor="meta_title">
                검색 엔진용 제목 (Meta Title) *
                {published && <span className="ml-1 text-destructive">(발행 시 필수)</span>}
              </Label>
              <Input
                id="meta_title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || '블로그 포스트 제목'}
                maxLength={60}
                required
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                검색 결과에 표시될 제목입니다. {metaTitle.length}/60자 (권장: 50-60자)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">
                검색 결과 요약문 (Meta Description) *
                {published && <span className="ml-1 text-destructive">(발행 시 필수)</span>}
              </Label>
              <Textarea
                id="meta_description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={summary || '블로그 포스트 요약'}
                maxLength={160}
                rows={3}
                required
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                검색 결과에 표시될 설명입니다. {metaDescription.length}/160자 (권장: 120-160자)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>본문 내용</Label>
            <BlogEditorWrapper
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

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || uploading}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              취소
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={saving || uploading}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              {saving ? '처리 중...' : '임시저장'}
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={saving || uploading}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              {saving ? '처리 중...' : '발행하기'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
