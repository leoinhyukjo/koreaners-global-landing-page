import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경 변수 체크 (빌드 시 에러 방지를 위해 throw 제거)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables')
  console.warn('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  // 빌드 성공을 위해 에러를 throw하지 않음
}

// 서버 컴포넌트용 Supabase 클라이언트 생성 함수
export async function createClient() {
  const cookieStore = await cookies()

  // 환경 변수 체크 (빌드 시 에러 방지를 위해 throw 제거)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables are missing. Some features may not work.')
    // 빌드 성공을 위해 빈 문자열로 클라이언트 생성
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
          // 서버 컴포넌트에서 쿠키 설정은 제한적일 수 있음
          console.error('쿠키 설정 오류:', error)
        }
      },
    },
  })
}
