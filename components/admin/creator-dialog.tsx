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
import { X, Instagram, Youtube, Music, Twitter } from 'lucide-react'

const STORAGE_BUCKET = 'website-assets'

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
  const [xUrl, setXUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (creator) {
      setName(creator.name)
      setProfileImageUrl(creator.profile_image_url || '')
      setInstagramUrl(creator.instagram_url || '')
      setYoutubeUrl(creator.youtube_url || '')
      setTiktokUrl(creator.tiktok_url || '')
      setXUrl(creator.x_url || creator.twitter_url || '')
    } else {
      // 새 크리에이터인 경우 초기화
      setName('')
      setProfileImageUrl('')
      setInstagramUrl('')
      setYoutubeUrl('')
      setTiktokUrl('')
      setXUrl('')
    }
  }, [creator, open])

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
        console.error('[CreatorDialog] Public URL이 비어있음!')
        throw new Error('이미지 URL을 생성할 수 없습니다.')
      }

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
        const finalData = {
          name,
          profile_image_url: profileImageUrl || null,
          instagram_url: instagramUrl || null,
          youtube_url: youtubeUrl || null,
          tiktok_url: tiktokUrl || null,
          x_url: xUrl || null,
        }

        console.log('3. DB에 저장될 최종 객체:', finalData)

        const { error } = await supabase
          .from('creators')
          .update(finalData)
          .eq('id', creator.id)

        if (error) throw error

        toast({
          title: '성공',
          description: '크리에이터가 수정되었습니다.',
        })
      } else {
        // 생성
        const finalData = {
          name,
          profile_image_url: profileImageUrl || null,
          instagram_url: instagramUrl || null,
          youtube_url: youtubeUrl || null,
          tiktok_url: tiktokUrl || null,
          x_url: xUrl || null,
        }

        console.log('3. DB에 저장될 최종 객체:', finalData)

        const { error } = await supabase.from('creators').insert(finalData)

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

  const dialogContentClass = [
    'overflow-y-auto',
    'h-[100dvh] w-full max-h-none max-w-none rounded-none border-0 p-4',
    'inset-0 top-0 left-0 translate-x-0 translate-y-0',
    'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-auto md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border md:p-6',
  ].join(' ')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle>
            {creator ? '크리에이터 수정' : '새 크리에이터'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
            <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center">
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

          <div className="space-y-4">
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
                <Twitter className="h-4 w-4" />
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
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto sm:min-h-0"
            >
              {creator ? '수정' : '생성'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
