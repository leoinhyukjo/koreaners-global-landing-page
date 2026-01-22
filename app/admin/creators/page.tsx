'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
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
import { X, Instagram, Youtube, Music } from 'lucide-react'

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 폼 상태
  const [name, setName] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')

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
    setDialogOpen(true)
  }

  function resetForm() {
    setName('')
    setProfileImageUrl('')
    setInstagramUrl('')
    setYoutubeUrl('')
    setTiktokUrl('')
  }

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
    } catch (error) {
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
      }

      if (editingCreator) {
        // 수정
        const { error } = await supabase
          .from('creators')
          .update(creatorData)
          .eq('id', editingCreator.id)

        if (error) throw error
        alert('크리에이터가 수정되었습니다.')
      } else {
        // 생성
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">크리에이터 관리</h1>
          <p className="text-muted-foreground">크리에이터를 추가, 수정, 삭제할 수 있습니다</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          새 크리에이터
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
        ) : creators.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            등록된 크리에이터가 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>프로필 이미지</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>YouTube</TableHead>
                <TableHead>TikTok</TableHead>
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
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">없음</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {creator.instagram_url ? (
                      <a
                        href={creator.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        링크
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {creator.youtube_url ? (
                      <a
                        href={creator.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        링크
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {creator.tiktok_url ? (
                      <a
                        href={creator.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        링크
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(creator.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(creator)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(creator.id)}
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

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCreator ? '크리에이터 수정' : '새 크리에이터'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="크리에이터 이름"
              />
            </div>

            <div>
              <Label>프로필 이미지</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {profileImageUrl && (
                  <div className="relative w-20 h-20">
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                    <button
                      onClick={() => setProfileImageUrl('')}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram URL
              </Label>
              <Input
                id="instagram"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/..."
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube URL
              </Label>
              <Input
                id="youtube"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="tiktok" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                TikTok URL
              </Label>
              <Input
                id="tiktok"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/..."
                type="url"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
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
