'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import { X, Instagram, Youtube, Music } from 'lucide-react'

interface CreatorDialogProps {
  open: boolean
  onClose: () => void
  creator: Creator | null
}

export function CreatorDialog({ open, onClose, creator }: CreatorDialogProps) {
  const [name, setName] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (creator) {
      setName(creator.name)
      setProfileImageUrl(creator.profile_image_url || '')
      setInstagramUrl(creator.instagram_url || '')
      setYoutubeUrl(creator.youtube_url || '')
      setTiktokUrl(creator.tiktok_url || '')
    } else {
      // 새 크리에이터인 경우 초기화
      setName('')
      setProfileImageUrl('')
      setInstagramUrl('')
      setYoutubeUrl('')
      setTiktokUrl('')
    }
  }, [creator, open])

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
      toast({
        title: '업로드 실패',
        description: error.message || '이미지 업로드에 실패했습니다.',
        variant: 'destructive',
      })
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
      toast({
        title: '성공',
        description: '프로필 이미지가 업로드되었습니다.',
      })
    } catch (error) {
      // 에러는 uploadImage에서 처리됨
    }
  }

  async function handleSubmit() {
    if (!name) {
      toast({
        title: '필수 항목',
        description: '이름을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      if (creator) {
        // 수정
        const { error } = await supabase
          .from('creators')
          .update({
            name,
            profile_image_url: profileImageUrl || null,
            instagram_url: instagramUrl || null,
            youtube_url: youtubeUrl || null,
            tiktok_url: tiktokUrl || null,
          })
          .eq('id', creator.id)

        if (error) throw error

        toast({
          title: '성공',
          description: '크리에이터가 수정되었습니다.',
        })
      } else {
        // 생성
        const { error } = await supabase.from('creators').insert({
          name,
          profile_image_url: profileImageUrl || null,
          instagram_url: instagramUrl || null,
          youtube_url: youtubeUrl || null,
          tiktok_url: tiktokUrl || null,
        })

        if (error) throw error

        toast({
          title: '성공',
          description: '크리에이터가 생성되었습니다.',
        })
      }

      onClose()
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {creator ? '크리에이터 수정' : '새 크리에이터'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 기본 정보 */}
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="크리에이터 이름"
            />
          </div>

          {/* 프로필 이미지 */}
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

          {/* SNS 링크 */}
          <div className="space-y-4">
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
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {creator ? '수정' : '생성'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
