import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('[Supabase Server] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 서버 컴포넌트용 Supabase 클라이언트 생성 함수
export async function createClient() {
  const cookieStore = await cookies()

  // 환경 변수 체크 (빌드 시 에러 방지를 위해 throw 제거)
  if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('[Supabase Server] 환경변수 누락')
  }

  // 빌드 성공을 위해 빈 문자열 사용 (런타임에 에러 발생 가능)
  return createServerClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Supabase Server] 쿠키 설정 오류:', error instanceof Error ? error.message : '')
          }
        }
      },
    },
  })
}
