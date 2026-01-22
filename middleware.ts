import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // /admin으로 시작하는 경로만 체크
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // 세션 확인 중 에러 로깅 (프로덕션에서는 제거 가능)
  if (sessionError && process.env.NODE_ENV === 'development') {
    console.error('Middleware 세션 확인 오류:', sessionError)
  }

  // 로그인 페이지 접근 시
  if (pathname === '/admin/login') {
    // 이미 로그인되어 있으면 대시보드로 리다이렉트
    if (user) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // 세션이 없으면 로그인 페이지 접근 허용
    return response
  }

  // 다른 /admin 경로 접근 시
  // 세션이 없으면 로그인 페이지로 리다이렉트
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 세션이 있으면 접근 허용
  return response
}

// Vercel 최신 권장 사항에 따른 matcher 설정
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
