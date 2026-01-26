'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

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

export default function BlogPage() {
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Card className="p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : blogPosts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          작성된 인사이트가 없습니다.
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
                    <TableHead>슬러그</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">{post.slug}</code>
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
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* 모바일: 카드 리스트 */}
          <div className="space-y-4 md:hidden">
            {blogPosts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden border-border transition-colors hover:border-primary/30"
              >
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold leading-snug line-clamp-2">{post.title}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{post.slug}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    {post.published ? (
                      <Badge variant="default" className="text-xs">발행됨</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">임시저장</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                      className="min-h-[44px] flex-1 gap-2 touch-manipulation"
                    >
                      <Edit className="h-4 w-4 shrink-0" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
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
    </div>
  )
}
