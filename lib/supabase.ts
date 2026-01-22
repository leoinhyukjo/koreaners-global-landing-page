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
}

export type Creator = {
  id: string
  name: string
  profile_image_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  tiktok_url: string | null
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
}
