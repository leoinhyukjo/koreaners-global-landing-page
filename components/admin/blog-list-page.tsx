'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import type { BlogPost } from '@/lib/supabase'
import { resolveThumbnailSrc } from '@/lib/thumbnail'

export function BlogListPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  async function fetchBlogPosts() {
    try {
      setLoading(true)

      const { data, error: supabaseError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (supabaseError) {
        console.error('[Admin Blog] 에러: ' + (supabaseError?.message || '알 수 없는 에러'))
        throw supabaseError
      }

      const posts = Array.isArray(data) ? data : []
      setBlogPosts(posts)
    } catch (err: any) {
      const errorMessage = err?.message || '알 수 없는 에러'
      console.error('[Admin Blog] 에러: ' + errorMessage)
      alert('블로그 포스트를 불러오는데 실패했습니다: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    window.location.href = '/admin/blog/edit'
  }

  function handleEdit(post: BlogPost) {
    window.location.href = `/admin/blog/edit?id=${post.id}`
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error: supabaseError } = await supabase.from('blog_posts').delete().eq('id', id)

      if (supabaseError) {
        console.error('[Admin Blog] 삭제 에러: ' + (supabaseError?.message || '알 수 없는 에러'))
        throw supabaseError
      }

      alert('블로그 포스트가 삭제되었습니다.')
      fetchBlogPosts()
    } catch (err: any) {
      const errorMessage = err?.message || '알 수 없는 에러'
      console.error('[Admin Blog] 삭제 에러: ' + errorMessage)
      alert('삭제에 실패했습니다: ' + errorMessage)
    }
  }

  const STORAGE_BUCKET = 'website-assets'

  /** 썸네일 표시용 URL: Supabase 전체 URL이면 그대로, 스토리지 경로면 getPublicUrl 사용 */
  function getThumbnailDisplaySrc(post: BlogPost): string {
    const raw = post.thumbnail_url?.trim()
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    const path = raw.replace(/^\/+/, '').replace(/^public\//, '')
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return data?.publicUrl ?? resolveThumbnailSrc(raw)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">글로벌 마케팅 인사이트 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            글로벌 마케팅 트렌드, 최신 뉴스, 실무 인사이트를 아우르는 전문 지식 채널을 관리합니다
          </p>
        </div>
        <Button onClick={handleCreate} className="h-11 shrink-0 px-5 sm:h-10">
          <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
          <span className="sm:inline">새 포스트 작성</span>
        </Button>
      </div>

      {loading ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : blogPosts.length === 0 ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">
          작성된 인사이트가 없습니다.
        </Card>
      ) : (
        <>
          {/* 데스크톱: 크리에이터 관리와 동일한 테이블 스타일 + 썸네일 컬럼 */}
          <div className="hidden md:block">
            <Card className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>썸네일</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts.map((post) => {
                    const thumbSrc = getThumbnailDisplaySrc(post)
                    return (
                      <TableRow key={post.id}>
                        <TableCell>
                          {thumbSrc ? (
                            <>
                              <img
                                src={thumbSrc}
                                alt=""
                                className="h-12 w-16 object-cover rounded border border-border bg-muted"
                                onError={(e) => {
                                  const t = e.currentTarget
                                  t.onerror = null
                                  t.style.display = 'none'
                                  const fallback = t.nextElementSibling as HTMLElement
                                  if (fallback) {
                                    fallback.classList.remove('hidden')
                                    fallback.classList.add('text-sm', 'text-muted-foreground')
                                  }
                                }}
                              />
                              <span className="hidden text-sm text-muted-foreground" aria-hidden>없음</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">없음</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium max-w-[280px]">
                          <span className="truncate block" title={post.title}>{post.title}</span>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground mt-0.5 block truncate">
                            {post.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{post.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {post.published ? (
                            <Badge variant="default">발행됨</Badge>
                          ) : (
                            <Badge variant="outline">임시저장</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(post.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(post)}
                              className="h-9 w-9"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(post.id)}
                              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* 모바일: 크리에이터 관리와 동일한 카드 스타일(썸네일 + 제목/날짜/상태 + 편집/삭제) */}
          <div className="space-y-4 md:hidden">
            {blogPosts.map((post) => {
              const thumbSrc = getThumbnailDisplaySrc(post)
              return (
                <Card key={post.id} className="rounded-lg border shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt=""
                        className="h-12 w-16 shrink-0 object-cover rounded border border-border bg-muted"
                        onError={(e) => {
                          const t = e.currentTarget
                          t.onerror = null
                          t.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="h-12 w-16 shrink-0 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        없음
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" title={post.title}>{post.title}</h3>
                      <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                        {post.published ? (
                          <Badge variant="default" className="text-xs">발행됨</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">임시저장</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post)} className="h-9 w-9">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(post.id)}
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
