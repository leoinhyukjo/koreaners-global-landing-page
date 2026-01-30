'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Instagram, Youtube, Music, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import type { Creator } from '@/lib/supabase'

const STORAGE_BUCKET = 'website-assets'

export function CreatorsListPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [name, setName] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [xUrl, setXUrl] = useState('')

  useEffect(() => {
    fetchCreators()
  }, [])

  async function fetchCreators() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCreators(data || [])
    } catch (error: any) {
      console.error('Error fetching creators:', error)
      alert('크리에이터를 불러오는데 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingCreator(null)
    resetForm()
    setDialogOpen(true)
  }

  function handleEdit(creator: Creator) {
    setEditingCreator(creator)
    setName(creator.name)
    setProfileImageUrl(creator.profile_image_url || '')
    setInstagramUrl(creator.instagram_url || '')
    setYoutubeUrl(creator.youtube_url || '')
    setTiktokUrl(creator.tiktok_url || '')
    setXUrl(creator.x_url || creator.twitter_url || '')
    setDialogOpen(true)
  }

  function resetForm() {
    setName('')
    setProfileImageUrl('')
    setInstagramUrl('')
    setYoutubeUrl('')
    setTiktokUrl('')
    setXUrl('')
  }

  async function uploadImage(file: File): Promise<string> {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `creators/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

      if (!publicUrl) throw new Error('이미지 URL을 생성할 수 없습니다.')

      return publicUrl
    } catch (error: any) {
      alert('이미지 업로드에 실패했습니다: ' + error.message)
      throw error
    } finally {
      setUploading(false)
    }
  }

  async function handleProfileImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadImage(file)
      setProfileImageUrl(url)
      alert('프로필 이미지가 업로드되었습니다.')
    } catch {
      // 에러는 uploadImage에서 처리됨
    }
  }

  async function handleSave() {
    if (!name) {
      alert('이름을 입력해주세요.')
      return
    }

    try {
      setSaving(true)
      const creatorData = {
        name,
        profile_image_url: profileImageUrl || null,
        instagram_url: instagramUrl || null,
        youtube_url: youtubeUrl || null,
        tiktok_url: tiktokUrl || null,
        x_url: xUrl || null,
      }

      if (editingCreator) {
        const { error } = await supabase
          .from('creators')
          .update(creatorData)
          .eq('id', editingCreator.id)

        if (error) throw error
        alert('크리에이터가 수정되었습니다.')
      } else {
        const { error } = await supabase.from('creators').insert(creatorData)

        if (error) throw error
        alert('크리에이터가 생성되었습니다.')
      }

      setDialogOpen(false)
      resetForm()
      fetchCreators()
    } catch (error: any) {
      console.error('Error saving creator:', error)
      alert('저장에 실패했습니다: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase.from('creators').delete().eq('id', id)

      if (error) throw error
      alert('크리에이터가 삭제되었습니다.')
      fetchCreators()
    } catch (error: any) {
      console.error('Error deleting creator:', error)
      alert('삭제에 실패했습니다: ' + error.message)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">크리에이터 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            크리에이터를 추가, 수정, 삭제할 수 있습니다
          </p>
        </div>
        <Button onClick={handleCreate} className="h-11 shrink-0 px-5 sm:h-10">
          <Plus className="h-4 w-4 shrink-0 sm:mr-2" />
          <span className="sm:inline">새 크리에이터</span>
        </Button>
      </div>

      {loading ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : creators.length === 0 ? (
        <Card className="rounded-lg border shadow-sm p-6 sm:p-8 text-center text-muted-foreground">
          등록된 크리에이터가 없습니다.
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>프로필 이미지</TableHead>
                    <TableHead>SNS</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell className="font-medium">{creator.name}</TableCell>
                      <TableCell>
                        {creator.profile_image_url ? (
                          <img
                            src={creator.profile_image_url}
                            alt={creator.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">없음</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {creator.instagram_url && <Instagram className="h-4 w-4 text-muted-foreground" />}
                          {creator.youtube_url && <Youtube className="h-4 w-4 text-muted-foreground" />}
                          {creator.tiktok_url && <Music className="h-4 w-4 text-muted-foreground" />}
                          {(creator.x_url || creator.twitter_url) && <X className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(creator.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleEdit(creator)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(creator.id)}
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

          <div className="space-y-4 md:hidden">
            {creators.map((creator) => (
              <Card key={creator.id} className="rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-4">
                  {creator.profile_image_url && (
                    <img src={creator.profile_image_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{creator.name}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(creator.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(creator)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(creator.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCreator ? '크리에이터 수정' : '새 크리에이터'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
              </div>
              <div className="space-y-2">
                <Label>프로필 이미지</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={handleProfileImageUpload} disabled={uploading} />
                  {profileImageUrl && <img src={profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>TikTok URL</Label>
                <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>X (Twitter) URL</Label>
                <Input value={xUrl} onChange={(e) => setXUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving ? '저장 중...' : editingCreator ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
