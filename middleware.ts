import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // /admin으로 시작하는 경로만 체크
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Next.js 16 최신 규격에 맞춘 response 생성
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
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

  // 세션 확인 중 에러 로깅 (프로덕션에서는 제거)
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

// Next.js 16 최신 규격에 따른 matcher 설정
// middleware 파일 convention 경고를 피하기 위해 명확한 경로만 지정
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
