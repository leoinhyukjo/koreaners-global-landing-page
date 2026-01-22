'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 연결 설정 강제 점검 및 로깅
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-key'

// URL 로깅 (전체 출력)
console.log('[Supabase Client] URL:', finalUrl)

// ANON_KEY 로깅 (앞 4자리만 출력)
const keyPreview = finalKey.length >= 4 
  ? `${finalKey.substring(0, 4)}...` 
  : '****'
console.log('[Supabase Client] ANON_KEY:', keyPreview)

// 환경 변수 체크 및 경고
if (!supabaseUrl || !supabaseAnonKey || finalUrl === 'https://placeholder.supabase.co') {
  const errorMsg = '⚠️ 환경변수 설정이 누락되었습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.'
  console.error('[Supabase Client]', errorMsg)
  console.error('[Supabase Client] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('[Supabase Client] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  
  // placeholder 사용 시 명확한 에러 메시지
  if (finalUrl === 'https://placeholder.supabase.co') {
    console.error('[Supabase Client] Placeholder URL detected - 환경변수를 설정해주세요!')
  }
}

// 브라우저용 Supabase 클라이언트
// 쿠키가 자동으로 저장되고 전송됨
export const supabase = createBrowserClient(finalUrl, finalKey)

// 클라이언트 생성 확인
console.log('[Supabase Client] Client initialized:', {
  url: finalUrl,
  hasKey: !!finalKey && finalKey !== 'placeholder-key',
  isPlaceholder: finalUrl === 'https://placeholder.supabase.co',
})
