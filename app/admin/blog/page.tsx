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

      // 데이터 안전 처리
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">글로벌 마케팅 인사이트 관리</h1>
          <p className="text-muted-foreground">글로벌 마케팅 트렌드, 최신 뉴스, 실무 인사이트를 아우르는 전문 지식 채널을 관리합니다</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          새 포스트 작성
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
        ) : blogPosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            작성된 인사이트가 없습니다.
          </div>
        ) : (
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
                    <code className="text-xs bg-muted px-2 py-1 rounded">{post.slug}</code>
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
                        size="icon-sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(post.id)}
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

    </div>
  )
}
