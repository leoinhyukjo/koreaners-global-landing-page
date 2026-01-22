import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // /admin으로 시작하는 경로만 체크
  if (pathname.startsWith('/admin')) {
    const supabase = createClient(request, response)

    if (!supabase) {
      // 환경 변수가 없으면 로그인 페이지로 리다이렉트
      if (pathname !== '/admin/login') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      return response
    }

    // 세션 갱신: 쿠키를 업데이트하여 세션 동기화
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser()

    // 세션 확인 중 에러 로깅
    if (sessionError) {
      console.error('Middleware 세션 확인 오류:', sessionError)
    }

    // 로그인 페이지 접근 시
    if (pathname === '/admin/login') {
      // 이미 로그인되어 있으면 대시보드로 리다이렉트
      if (user) {
        console.log('✅ Middleware: 로그인된 사용자가 로그인 페이지 접근, /admin으로 리다이렉트')
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      // 세션이 없으면 로그인 페이지 접근 허용
      return response
    }

    // 다른 /admin 경로 접근 시
    // 세션이 없으면 로그인 페이지로 리다이렉트
    if (!user) {
      console.log('❌ Middleware: 세션 없음, /admin/login으로 리다이렉트')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // 세션이 있으면 접근 허용
    console.log('✅ Middleware: 세션 확인됨, 접근 허용', { userId: user.id })
  }

  return response
}

export const config = {
  matcher: '/admin/:path*',
}
