'use client'

// 관리자 페이지는 빌드 타임에 정적으로 생성하지 않고 런타임에 동적으로 생성
export const dynamic = 'force-dynamic'

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

export default function CreatorsPage() {
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
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `creators/${fileName}`

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
        console.error('[CreatorsPage] Public URL이 비어있음!')
        throw new Error('이미지 URL을 생성할 수 없습니다.')
      }

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
        // X(Twitter) URL - Supabase 테이블에 x_url(text) 컬럼을 추가하세요.
        x_url: xUrl || null,
      }

      console.log('3. DB에 저장될 최종 객체:', creatorData)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Card className="p-8 text-center text-muted-foreground">로딩 중...</Card>
      ) : creators.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          등록된 크리에이터가 없습니다.
        </Card>
      ) : (
        <>
          {/* 데스크톱: 테이블 */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>프로필 이미지</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>YouTube</TableHead>
                  <TableHead>TikTok</TableHead>
                  <TableHead>X</TableHead>
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
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                      <TableCell>
                        {creator.x_url || creator.twitter_url ? (
                          <a
                            href={creator.x_url || creator.twitter_url || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            <span>링크</span>
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                          <span className="text-sm text-muted-foreground">-</span>
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
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
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

          {/* 모바일: 카드 리스트 */}
          <div className="space-y-4 md:hidden">
            {creators.map((creator) => (
              <Card
                key={creator.id}
                className="overflow-hidden border-border transition-colors hover:border-primary/30"
              >
                <div className="flex gap-4 p-4 sm:p-5">
                  <div className="shrink-0">
                    {creator.profile_image_url ? (
                      <img
                        src={creator.profile_image_url}
                        alt={creator.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <span className="text-xs">없음</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-snug">{creator.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {creator.instagram_url && (
                        <span className="inline-flex items-center gap-1">
                          <Instagram className="h-3 w-3" /> IG
                        </span>
                      )}
                      {creator.youtube_url && (
                        <span className="inline-flex items-center gap-1">
                          <Youtube className="h-3 w-3" /> YT
                        </span>
                      )}
                      {creator.tiktok_url && (
                        <span className="inline-flex items-center gap-1">
                          <Music className="h-3 w-3" /> TT
                        </span>
                      )}
                      {(creator.x_url || creator.twitter_url) && (
                        <span className="inline-flex items-center gap-1">
                          <X className="h-3 w-3" /> X
                        </span>
                      )}
                      {new Date(creator.created_at).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(creator)}
                        className="min-h-[44px] flex-1 gap-2 touch-manipulation"
                      >
                        <Edit className="h-4 w-4 shrink-0" />
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(creator.id)}
                        className="min-h-[44px] flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={[
            'overflow-y-auto',
            'h-[100dvh] w-full max-h-none max-w-none rounded-none border-0 p-4',
            'inset-0 top-0 left-0 translate-x-0 translate-y-0',
            'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-auto md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border md:p-6',
          ].join(' ')}
        >
          <DialogHeader>
            <DialogTitle>
              {editingCreator ? '크리에이터 수정' : '새 크리에이터'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="크리에이터 이름"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>프로필 이미지</Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={uploading}
                  className="w-full flex-1"
                />
                {profileImageUrl && (
                  <div className="relative h-20 w-20 shrink-0">
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProfileImageUrl('')}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                      aria-label="이미지 제거"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
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
                className="w-full"
              />
            </div>

            <div className="space-y-2">
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
                className="w-full"
              />
            </div>

            <div className="space-y-2">
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
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="x" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                X (Twitter) URL
              </Label>
              <Input
                id="x"
                value={xUrl}
                onChange={(e) => setXUrl(e.target.value)}
                placeholder="https://x.com/..."
                type="url"
                className="w-full"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || uploading}
                className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
              >
                {saving ? '저장 중...' : editingCreator ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
