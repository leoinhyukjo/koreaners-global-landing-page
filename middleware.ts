import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware
 *
 * Admin 경로에 대한 서버 측 인증 보호
 * - /admin/* 경로는 인증된 사용자만 접근 가능
 * - 미인증 사용자는 /admin/login으로 리다이렉트
 * - 인증된 사용자가 /admin/login 접근 시 /admin으로 리다이렉트
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createClient(request, response)

  if (!supabase) {
    // Supabase 클라이언트 생성 실패 시 그대로 진행
    return response
  }

  const pathname = request.nextUrl.pathname

  // Admin 경로 보호
  if (pathname.startsWith('/admin')) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('[Middleware] Session error:', error.message)
      }

      // 인증되지 않은 사용자
      if (!session) {
        // 이미 로그인 페이지라면 그대로 진행
        if (pathname === '/admin/login') {
          return response
        }

        // 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/admin/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // 인증된 사용자가 로그인 페이지 접근 시
      if (session && pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    } catch (error) {
      console.error('[Middleware] Error:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return response
}

// Middleware가 적용될 경로 설정
export const config = {
  matcher: [
    // Admin 경로 전체
    '/admin/:path*',

    // 추가: API 경로에도 적용 가능 (선택사항)
    // '/api/admin/:path*',
  ],
}
