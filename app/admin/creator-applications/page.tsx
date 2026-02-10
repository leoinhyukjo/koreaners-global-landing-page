'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'

interface CreatorApplication {
  id: string
  created_at: string
  track_type: 'exclusive' | 'partner'
  name: string
  email: string
  phone: string | null
  instagram_url: string
  youtube_url: string | null
  tiktok_url: string | null
  x_url: string | null
  message: string | null
  locale: string
}

export default function CreatorApplicationsPage() {
  const [applications, setApplications] = useState<CreatorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  async function fetchApplications() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('creator_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error: any) {
      console.error('Error fetching applications:', error)
      alert('크리에이터 신청 내역을 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleView(app: CreatorApplication) {
    setSelectedApp(app)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('creator_applications')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDialogOpen(false)
      fetchApplications()
    } catch (error: any) {
      console.error('Error deleting application:', error)
      alert('삭제에 실패했습니다: ' + error.message)
    }
  }

  const trackTypeLabel = (type: string) => {
    return type === 'exclusive' ? '전속 크리에이터' : '파트너'
  }

  const trackTypeColor = (type: string) => {
    return type === 'exclusive' ? 'bg-blue-500' : 'bg-purple-500'
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl text-white">크리에이터 합류 신청</h1>
        <p className="mt-1 text-sm text-zinc-300 sm:text-base">전체 {applications.length}건</p>
      </div>

      {loading ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : applications.length === 0 ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">
          신청 내역이 없습니다.
        </Card>
      ) : (
        <>
          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block">
            <Card className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>신청일</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>트랙</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(app)}
                    >
                      <TableCell className="text-foreground">
                        {new Date(app.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{app.name}</TableCell>
                      <TableCell className="text-foreground">{app.email}</TableCell>
                      <TableCell className="text-foreground">{app.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={`${trackTypeColor(app.track_type)} text-white border-0`}>
                          {trackTypeLabel(app.track_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
                            onClick={() => handleDelete(app.id)}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
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
            {applications.map((app) => (
              <Card
                key={app.id}
                className="rounded-lg border shadow-sm overflow-hidden border-border transition-colors hover:border-primary/30 cursor-pointer"
                onClick={() => handleView(app)}
              >
                <div className="p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-snug text-foreground">{app.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{app.email}</p>
                    </div>
                    <Badge className={`${trackTypeColor(app.track_type)} text-white border-0 shrink-0`}>
                      {trackTypeLabel(app.track_type)}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {app.phone && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">전화:</span> {app.phone}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">신청일:</span>{' '}
                      {new Date(app.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(app.id)}
                      className="min-h-[44px] gap-2 text-white border-white/50 hover:bg-white/10 hover:text-white touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4 shrink-0 text-white" />
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 상세보기 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={[
            'overflow-y-auto',
            'h-[100dvh] w-full max-h-none max-w-none rounded-none border-0 p-4',
            'inset-0 top-0 left-0 translate-x-0 translate-y-0',
            'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:p-6',
          ].join(' ')}
        >
          <DialogHeader>
            <DialogTitle>합류 신청 상세 내역</DialogTitle>
            {selectedApp && (
              <DialogDescription>
                {new Date(selectedApp.created_at).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-0 py-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1 py-4">
                  <p className="text-sm font-medium text-muted-foreground">이름</p>
                  <p className="text-base font-medium break-words">{selectedApp.name}</p>
                </div>
                <div className="space-y-1 py-4">
                  <p className="text-sm font-medium text-muted-foreground">트랙</p>
                  <Badge className={`${trackTypeColor(selectedApp.track_type)} text-white border-0`}>
                    {trackTypeLabel(selectedApp.track_type)}
                  </Badge>
                </div>
                <div className="space-y-1 py-4">
                  <p className="text-sm font-medium text-muted-foreground">이메일</p>
                  <p className="text-base font-medium break-words">{selectedApp.email}</p>
                </div>
                {selectedApp.phone && (
                  <div className="space-y-1 py-4">
                    <p className="text-sm font-medium text-muted-foreground">전화번호</p>
                    <p className="text-base font-medium break-words">{selectedApp.phone}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <p className="text-sm font-medium text-muted-foreground">SNS 링크</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20 shrink-0">Instagram</span>
                    <a href={selectedApp.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all">
                      {selectedApp.instagram_url}
                    </a>
                  </div>
                  {selectedApp.youtube_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20 shrink-0">YouTube</span>
                      <a href={selectedApp.youtube_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all">
                        {selectedApp.youtube_url}
                      </a>
                    </div>
                  )}
                  {selectedApp.tiktok_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20 shrink-0">TikTok</span>
                      <a href={selectedApp.tiktok_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all">
                        {selectedApp.tiktok_url}
                      </a>
                    </div>
                  )}
                  {selectedApp.x_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20 shrink-0">X</span>
                      <a href={selectedApp.x_url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all">
                        {selectedApp.x_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {selectedApp.message && (
                <div className="space-y-2 border-t border-border pt-6">
                  <p className="text-sm font-medium text-muted-foreground">추가 메시지</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                      {selectedApp.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-6 border-t border-border">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="sm:w-auto">
                  닫기
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedApp.id)}
                >
                  삭제
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
