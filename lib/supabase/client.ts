'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 연결 설정 강제 점검 및 로깅
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-key'

if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || !supabaseAnonKey || finalUrl === 'https://placeholder.supabase.co') {
    console.warn('[Supabase Client] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 확인')
  } else {
    console.log('[Supabase Client] initialized')
  }
}

export const supabase = createBrowserClient(finalUrl, finalKey)
