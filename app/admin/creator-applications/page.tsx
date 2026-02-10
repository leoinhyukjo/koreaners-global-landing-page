'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Trash2, ExternalLink } from 'lucide-react'
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
      alert('신청 내역이 삭제되었습니다.')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-400">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">크리에이터 합류 신청</h1>
        <p className="text-zinc-400">전체 {applications.length}건</p>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-300">신청일</TableHead>
                <TableHead className="text-zinc-300">이름</TableHead>
                <TableHead className="text-zinc-300">이메일</TableHead>
                <TableHead className="text-zinc-300">전화번호</TableHead>
                <TableHead className="text-zinc-300">트랙</TableHead>
                <TableHead className="text-zinc-300 w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow className="border-zinc-700">
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                    신청 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id} className="border-zinc-700 hover:bg-zinc-700/50">
                    <TableCell className="text-zinc-200">
                      {new Date(app.created_at).toLocaleDateString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-zinc-200 font-medium">{app.name}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{app.email}</TableCell>
                    <TableCell className="text-zinc-300 text-sm">{app.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`${trackTypeColor(app.track_type)} text-white border-0`}>
                        {trackTypeLabel(app.track_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(app)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-zinc-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(app.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedApp?.name} - {trackTypeLabel(selectedApp?.track_type || 'exclusive')}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {new Date(selectedApp?.created_at || '').toLocaleDateString('ko-KR')}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 text-zinc-200">
              <div>
                <label className="text-sm font-semibold text-zinc-300">이메일</label>
                <p className="text-zinc-100">{selectedApp.email}</p>
              </div>

              {selectedApp.phone && (
                <div>
                  <label className="text-sm font-semibold text-zinc-300">전화번호</label>
                  <p className="text-zinc-100">{selectedApp.phone}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-zinc-300">Instagram</label>
                <a
                  href={selectedApp.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  {selectedApp.instagram_url}
                </a>
              </div>

              {selectedApp.youtube_url && (
                <div>
                  <label className="text-sm font-semibold text-zinc-300">YouTube</label>
                  <a
                    href={selectedApp.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {selectedApp.youtube_url}
                  </a>
                </div>
              )}

              {selectedApp.tiktok_url && (
                <div>
                  <label className="text-sm font-semibold text-zinc-300">TikTok</label>
                  <a
                    href={selectedApp.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {selectedApp.tiktok_url}
                  </a>
                </div>
              )}

              {selectedApp.x_url && (
                <div>
                  <label className="text-sm font-semibold text-zinc-300">X (Twitter)</label>
                  <a
                    href={selectedApp.x_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {selectedApp.x_url}
                  </a>
                </div>
              )}

              {selectedApp.message && (
                <div>
                  <label className="text-sm font-semibold text-zinc-300">추가 메시지</label>
                  <p className="text-zinc-100 whitespace-pre-wrap">{selectedApp.message}</p>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-700">
                <Button
                  onClick={() => handleDelete(selectedApp.id)}
                  variant="destructive"
                  className="w-full"
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
