import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
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

  // 세션 갱신 + 사용자 확인. 예외 시 fail-closed (인증 없이 통과 방지 → 로그인으로).
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      if (process.env.NODE_ENV === 'development') console.error('Proxy 세션 확인 오류:', error)
    } else {
      user = data.user
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Proxy getUser 예외:', e)
    if (pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // 역할 판정: 서버 전용 app_metadata.role 만 신뢰 (user_metadata 는 사용자가 직접 수정
  // 가능 → 스푸핑 위험). role 없으면 admin(전체 접근, 기존 계정 보존).
  const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role as string | undefined
  const isExec = role === 'exec'

  // 로그인 페이지 접근 시
  if (pathname === '/admin/login') {
    // 이미 로그인되어 있으면 대시보드로 리다이렉트 (exec 는 세일즈 보드로)
    if (user) {
      return NextResponse.redirect(new URL(isExec ? '/admin/sales' : '/admin', request.url))
    }
    // 세션이 없으면 로그인 페이지 접근 허용
    return response
  }

  // 다른 /admin 경로 접근 시
  // 세션이 없으면 로그인 페이지로 리다이렉트
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 역할 게이트: exec 계정은 /admin/sales 만 접근 (마진·AR 등 /admin/projects 차단)
  if (isExec && !pathname.startsWith('/admin/sales')) {
    return NextResponse.redirect(new URL('/admin/sales', request.url))
  }

  // 세션이 있으면 접근 허용
  return response
}

// Next.js 16 최신 규격에 따른 matcher 설정
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
