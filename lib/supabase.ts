// Database types
// Supabase 클라이언트는 이제 분리된 파일에서 import하세요:
// - 클라이언트 컴포넌트: import { supabase } from '@/lib/supabase/client'
// - 서버 컴포넌트: import { createClient } from '@/lib/supabase/server'
// - Middleware: import { createClient } from '@/lib/supabase/middleware'

export type Portfolio = {
  id: string
  title: string
  client_name: string
  thumbnail_url: string | null
  category: string[]
  link: string | null
  content: any // BlockNote JSON
  created_at: string
  // 일본어 (KR=기존 필드, JP=아래)
  title_jp?: string | null
  client_name_jp?: string | null
  content_jp?: any | null
}

export type Creator = {
  id: string
  name: string
  profile_image_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  tiktok_url: string | null
  // X(Twitter) 링크 컬럼 (스키마에 따라 둘 중 하나 사용)
  x_url?: string | null
  twitter_url?: string | null
  created_at: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  category: string
  thumbnail_url: string | null
  summary: string | null
  content: any // BlockNote JSON
  published: boolean
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
  // 일본어
  title_jp?: string | null
  summary_jp?: string | null
  content_jp?: any | null
  meta_title_jp?: string | null
  meta_description_jp?: string | null
}

export type Inquiry = {
  id: string
  name: string
  company: string
  position: string
  email?: string
  phone: string
  message: string
  // DB 스키마에 따라 필드명이 다를 수 있음
  privacy_agreement?: boolean // DB 필드명: privacy_agreement 또는 privacy_policy
  privacy_consent?: boolean // 대체 필드명
  privacy_policy?: boolean // 대체 필드명
  marketing_agreement?: boolean // DB 필드명: marketing_agreement
  marketing_consent?: boolean // 대체 필드명 (사용 안 함)
  is_read?: boolean
  created_at: string
}
