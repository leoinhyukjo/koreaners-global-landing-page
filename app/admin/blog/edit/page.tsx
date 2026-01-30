'use client'

// 블로그 편집 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NextDynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
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
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, X, Save, Send } from 'lucide-react'
import type { BlockNoteEditor } from '@blocknote/core'
import { resolveThumbnailSrc } from '@/lib/thumbnail'

const STORAGE_BUCKET = 'website-assets'

// BlockNote 에디터를 클라이언트 사이드에서만 로드
const BlogEditor = NextDynamic(
  () => import('@/components/admin/blog-editor').then((mod) => ({ default: mod.BlogEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg overflow-hidden bg-card min-h-[600px] flex items-center justify-center">
        <p className="text-muted-foreground">에디터 로딩 중...</p>
      </div>
    ),
  }
)

const CATEGORIES = ['업계 동향', '최신 트렌드', '전문가 인사이트', '마케팅 뉴스'] as const

function BlogEditForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState<string>('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [titleJp, setTitleJp] = useState('')
  const [summaryJp, setSummaryJp] = useState('')
  const [metaTitleJp, setMetaTitleJp] = useState('')
  const [metaDescriptionJp, setMetaDescriptionJp] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!postId)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [editorContent, setEditorContent] = useState<any[]>([])
  const [initialEditorContent, setInitialEditorContent] = useState<any[] | undefined>(undefined)
  const [editorContentJp, setEditorContentJp] = useState<any[]>([])
  const [initialEditorContentJp, setInitialEditorContentJp] = useState<any[] | undefined>(undefined)
  const [isMounted, setIsMounted] = useState(false)
  const editorRef = useRef<BlockNoteEditor | null>(null)
  const editorRefJp = useRef<BlockNoteEditor | null>(null)

  // 하이드레이션 불일치 방지를 위한 마운트 체크
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (postId && isMounted) {
      loadBlogPost()
    }
  }, [postId, isMounted])

  async function loadBlogPost() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) throw error

      if (data) {
        setTitle(data.title || '')
        setSlug(data.slug || '')
        setCategory(data.category || '')
        setThumbnailUrl(data.thumbnail_url || '')
        setSummary(data.summary || '')
        setMetaTitle(data.meta_title || '')
        setMetaDescription(data.meta_description || '')
        setTitleJp(data.title_jp ?? '')
        setSummaryJp(data.summary_jp ?? '')
        setMetaTitleJp(data.meta_title_jp ?? '')
        setMetaDescriptionJp(data.meta_description_jp ?? '')
        setThumbnailFile(null)
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
          setInitialEditorContent(data.content)
        } else {
          setInitialEditorContent(undefined)
        }
        if (data.content_jp && Array.isArray(data.content_jp) && data.content_jp.length > 0) {
          setInitialEditorContentJp(data.content_jp)
        } else {
          setInitialEditorContentJp(undefined)
        }
      }
    } catch (err: any) {
      console.error('Error loading blog post:', err)
      toast({
        title: '로딩 실패',
        description: err.message || '블로그 포스트를 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 제목에서 슬러그 자동 생성
  useEffect(() => {
    if (!postId && title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSlug(autoSlug)
    }
  }, [title, postId])

  async function uploadImage(file: File): Promise<string> {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `blog/${fileName}`

      console.log('1. 파일 업로드 시도:', fileName)

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file)

      if (uploadError) {
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

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

      console.log('2. 획득된 Public URL:', publicUrl)

      if (!publicUrl || publicUrl.trim() === '') {
        console.error('[BlogEdit] Public URL이 비어있음!')
        throw new Error('이미지 URL을 생성할 수 없습니다.')
      }

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

  async function handleSubmit(publish: boolean) {
    console.log('1. 발행 시작', { publish, saving, postId })

    // 이미 저장 중이면 중복 실행 방지
    if (saving) {
      console.log('1-1. 이미 저장 중이므로 중단')
      toast({
        title: '처리 중',
        description: '이미 저장 중입니다. 잠시만 기다려주세요.',
        variant: 'default',
      })
      return
    }

    // 필수 필드 검증
    console.log('2. 제목 확인 시작', { title, titleTrimmed: title?.trim() })
    if (!title || !title.trim()) {
      console.log('2-1. 제목 누락')
      toast({
        title: '필수 항목 누락',
        description: '제목을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    console.log('2-2. 제목 확인 완료')

    console.log('3. 슬러그 확인 시작', { slug, slugTrimmed: slug?.trim() })
    if (!slug || !slug.trim()) {
      console.log('3-1. 슬러그 누락')
      toast({
        title: '필수 항목 누락',
        description: '슬러그를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      console.log('3-2. 슬러그 형식 오류', { slug })
      toast({
        title: '슬러그 형식 오류',
        description: '슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.',
        variant: 'destructive',
      })
      return
    }
    console.log('3-3. 슬러그 확인 완료')

    console.log('4. 카테고리 확인 시작', { category })
    if (!category) {
      console.log('4-1. 카테고리 누락')
      toast({
        title: '필수 항목 누락',
        description: '카테고리를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      console.log('4-2. 유효하지 않은 카테고리', { category })
      toast({
        title: '유효하지 않은 카테고리',
        description: '업계 동향, 최신 트렌드, 전문가 인사이트, 마케팅 뉴스 중 하나를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }
    console.log('4-3. 카테고리 확인 완료')

    console.log('5. 본문 내용 확인 시작', { 
      editorRef: !!editorRef.current,
      editorContent: editorContent.length,
      editorDocument: editorRef.current?.document?.length
    })
    const content = editorRef.current?.document || editorContent
    if (!content || !Array.isArray(content) || content.length === 0) {
      console.log('5-1. 본문 내용 누락', { content })
      toast({
        title: '필수 항목 누락',
        description: '본문 내용을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    console.log('5-2. 본문 내용 확인 완료', { contentLength: content.length })

    if (publish) {
      console.log('6. SEO 필드 확인 시작 (발행 모드)', { metaTitle, metaDescription })
      if (!metaTitle || !metaTitle.trim()) {
        console.log('6-1. Meta Title 누락')
        toast({
          title: 'SEO 필수 항목',
          description: '발행하려면 검색 엔진용 제목(Meta Title)을 입력해주세요.',
          variant: 'destructive',
        })
        return
      }
      if (!metaDescription || !metaDescription.trim()) {
        console.log('6-2. Meta Description 누락')
        toast({
          title: 'SEO 필수 항목',
          description: '발행하려면 검색 결과 요약문(Meta Description)을 입력해주세요.',
          variant: 'destructive',
        })
        return
      }
      console.log('6-3. SEO 필드 확인 완료')
    }

    console.log('7. 모든 검증 완료, 저장 시작')
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
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `blog/${fileName}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('[BlogEdit] 썸네일 업로드 에러:', uploadError)
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

          console.log('[BlogEdit] 썸네일 업로드 성공:', uploadData)

          const {
            data: { publicUrl },
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

          console.log('Step 2: 생성된 Public URL ->', publicUrl)

          if (!publicUrl || publicUrl.trim() === '') {
            console.error('[BlogEdit] 썸네일 Public URL이 비어있음!')
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

      if (postId) {
        // 수정
        console.log('8. 수정 모드 - DB 업데이트 시도', { postId })
        const contentJp = editorRefJp.current?.document ?? editorContentJp
        const updateData = {
          title: title.trim(),
          slug: slug.trim(),
          category,
          thumbnail_url: finalThumbnailUrl,
          summary: safeSummary,
          content,
          published: publish,
          meta_title: safeMetaTitle,
          meta_description: safeMetaDescription,
          title_jp: titleJp.trim() || null,
          summary_jp: summaryJp.trim() || null,
          content_jp: Array.isArray(contentJp) && contentJp.length > 0 ? contentJp : null,
          meta_title_jp: metaTitleJp.trim() || null,
          meta_description_jp: metaDescriptionJp.trim() || null,
          updated_at: new Date().toISOString(),
        }
        console.log('8-1. 업데이트 데이터:', updateData)
        console.log('Step 3: DB로 전송할 최종 Payload ->', updateData)

        const { data: updateResult, error } = await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', postId)
          .select()

        if (error) {
          console.error('[BlogEdit] 업데이트 실패:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            updateData: { ...updateData, content: 'Array(...)' },
            postId,
          })
          const errorMessage = error.message || '알 수 없는 에러'
          console.error('DB 업데이트 실패:', errorMessage)
          throw new Error(errorMessage)
        }

        if (!updateResult || updateResult.length === 0) {
          const errorMsg = '데이터가 업데이트되지 않았습니다.'
          console.error('[BlogEdit] 업데이트 결과 없음', { 
            postId, 
            updateData: { ...updateData, content: 'Array(...)' } 
          })
          alert(errorMsg)
          throw new Error(errorMsg)
        }

        console.log('8-2. DB 업데이트 성공!', { 
          id: updateResult[0]?.id, 
          title: updateResult[0]?.title,
          published: updateResult[0]?.published,
          summary: updateResult[0]?.summary || '(없음)',
        })
        toast({
          title: '저장 완료',
          description: publish ? '인사이트가 성공적으로 발행되었습니다.' : '인사이트가 임시저장되었습니다.',
        })
      } else {
        // 생성
        console.log('9. 생성 모드 - DB 저장 시도')
        const now = new Date().toISOString()
        const contentJp = editorRefJp.current?.document ?? editorContentJp
        const insertData = {
          title: title.trim(),
          slug: slug.trim(),
          category,
          thumbnail_url: finalThumbnailUrl,
          summary: safeSummary,
          content,
          published: publish,
          meta_title: safeMetaTitle,
          meta_description: safeMetaDescription,
          title_jp: titleJp.trim() || null,
          summary_jp: summaryJp.trim() || null,
          content_jp: Array.isArray(contentJp) && contentJp.length > 0 ? contentJp : null,
          meta_title_jp: metaTitleJp.trim() || null,
          meta_description_jp: metaDescriptionJp.trim() || null,
          updated_at: now,
        }
        console.log('9-1. 저장 데이터:', { 
          ...insertData, 
          content: Array.isArray(insertData.content) ? `Array(${insertData.content.length})` : 'Invalid',
          summary: insertData.summary || '(없음)',
          published: insertData.published,
        })
        console.log('Step 3: DB로 전송할 최종 Payload ->', insertData)

        const { data, error } = await supabase.from('blog_posts').insert(insertData).select()

        if (error) {
          console.error('[BlogEdit] 생성 실패:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            insertData: { ...insertData, content: 'Array(...)' },
          })
          const errorMessage = error.message || '알 수 없는 에러'
          console.error('DB 저장 실패:', errorMessage)
          throw new Error(errorMessage)
        }

        if (!data || data.length === 0) {
          const errorMsg = '데이터가 저장되지 않았습니다.'
          console.error('[BlogEdit] 저장 결과 없음', { insertData: { ...insertData, content: 'Array(...)' } })
          throw new Error(errorMsg)
        }

        console.log('9-2. DB 저장 성공!', { 
          id: data[0]?.id, 
          title: data[0]?.title,
          published: data[0]?.published,
          summary: data[0]?.summary || '(없음)',
        })
        toast({
          title: '저장 완료',
          description: publish ? '인사이트가 성공적으로 발행되었습니다.' : '인사이트가 임시저장되었습니다.',
        })
      }

      console.log('10. 리다이렉트 시작')
      router.push('/admin/blog')
    } catch (err: any) {
      const errorMessage = err?.message || '저장에 실패했습니다. 필수 필드를 확인해주세요.'
      console.error('[BlogEdit] 저장 실패:', {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        stack: err?.stack,
        publish,
        postId,
        title,
        slug,
        category,
        hasContent: !!content && Array.isArray(content) && content.length > 0,
      })
      toast({
        title: '발행 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      console.log('11. 저장 프로세스 종료')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 touch-manipulation"
                onClick={() => router.push('/admin/blog')}
                aria-label="목록으로"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="truncate text-xl font-bold sm:text-2xl">
                {postId ? '포스트 수정' : '새 포스트 작성'}
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSubmit(false)
                }}
                disabled={saving || uploading}
                className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
              >
                <Save className="h-4 w-4 shrink-0 sm:mr-2" />
                {saving ? '처리 중...' : '임시저장'}
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSubmit(true)
                }}
                disabled={saving || uploading}
                className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
              >
                <Send className="h-4 w-4 shrink-0 sm:mr-2" />
                {saving ? '처리 중...' : '발행하기'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* 왼쪽: 메타 정보 */}
          <div className="space-y-6 lg:col-span-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="포스트 제목"
                  className="mt-1 w-full"
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
                  placeholder="post-url-slug"
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  영문 소문자, 숫자, 하이픈만 사용 가능
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                {!isMounted ? (
                  <div className="mt-1 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2">
                    <span className="text-muted-foreground">카테고리 선택</span>
                  </div>
                ) : (
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="mt-1 w-full">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">요약</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="포스트 요약"
                  className="mt-1 w-full"
                  rows={3}
                />
              </div>

              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 pt-4">[일본어]</h3>
              <div className="space-y-2">
                <Label htmlFor="title_jp">제목 (JP)</Label>
                <Input
                  id="title_jp"
                  value={titleJp}
                  onChange={(e) => setTitleJp(e.target.value)}
                  placeholder="タイトル（日本語）"
                  className="mt-1 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary_jp">요약 (JP)</Label>
                <Textarea
                  id="summary_jp"
                  value={summaryJp}
                  onChange={(e) => setSummaryJp(e.target.value)}
                  placeholder="要約（日本語）"
                  className="mt-1 w-full"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>썸네일 이미지</Label>
                <div className="mt-1 space-y-2">
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
                    className="w-full"
                  />
                  {thumbnailUrl && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border">
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setThumbnailUrl('')}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SEO 설정 */}
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="text-lg font-semibold">SEO 설정</h3>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title *</Label>
                <Input
                  id="meta_title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || '검색 엔진용 제목'}
                  maxLength={60}
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">{metaTitle.length}/60자</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description *</Label>
                <Textarea
                  id="meta_description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={summary || '검색 결과 요약문'}
                  maxLength={160}
                  rows={3}
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">{metaDescription.length}/160자</p>
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 pt-4">[일본어] SEO</h3>
              <div className="space-y-2">
                <Label htmlFor="meta_title_jp">Meta Title (JP)</Label>
                <Input
                  id="meta_title_jp"
                  value={metaTitleJp}
                  onChange={(e) => setMetaTitleJp(e.target.value)}
                  placeholder={titleJp || 'Meta Title（日本語）'}
                  maxLength={60}
                  className="mt-1 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description_jp">Meta Description (JP)</Label>
                <Textarea
                  id="meta_description_jp"
                  value={metaDescriptionJp}
                  onChange={(e) => setMetaDescriptionJp(e.target.value)}
                  placeholder={summaryJp || 'Meta Description（日本語）'}
                  maxLength={160}
                  rows={3}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          </div>

          {/* 오른쪽: 에디터 */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <Label>본문 내용 *</Label>
              {loading ? (
                <div className="border border-border rounded-lg overflow-hidden bg-card min-h-[600px] flex items-center justify-center">
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : (
                <>
                  <Label className="block mb-2">[한국어] 본문 내용 *</Label>
                  <BlogEditor
                    initialContent={initialEditorContent}
                    onContentChange={(content) => {
                      setEditorContent(content)
                    }}
                    uploadFile={uploadImage}
                    editorRef={(editor) => {
                      editorRef.current = editor
                    }}
                  />
                  <div className="mt-6">
                    <Label className="block mb-2">[일본어] 본문 내용 (JP)</Label>
                    <BlogEditor
                      initialContent={initialEditorContentJp}
                      onContentChange={(content) => {
                        setEditorContentJp(content)
                      }}
                      uploadFile={uploadImage}
                      editorRef={(editor) => {
                        editorRefJp.current = editor
                      }}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                    <div className="text-sm text-muted-foreground">
                      <strong className="text-foreground">💡 서식 팁:</strong> 텍스트를 선택하면 상단 툴바에서 
                      <strong className="text-foreground"> 굵게, 기울임, 밑줄, 취소선</strong>을 설정할 수 있고, 
                      <strong className="text-foreground"> 색상 아이콘</strong>을 클릭하면 텍스트 색상과 배경색을 변경할 수 있습니다.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BlogEditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      }
    >
      <BlogEditForm />
    </Suspense>
  )
}
