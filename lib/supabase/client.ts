'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경 변수 체크 (빌드 시 에러 방지를 위해 throw 제거)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables on client side')
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  // 빌드 성공을 위해 에러를 throw하지 않고 빈 문자열로 클라이언트 생성
}

// 브라우저용 Supabase 클라이언트
// 쿠키가 자동으로 저장되고 전송됨
// 환경변수가 없어도 빌드가 성공하도록 빈 문자열 사용
export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
