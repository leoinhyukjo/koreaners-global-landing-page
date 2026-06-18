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
  // 가능 → 스푸핑 위험).
  // fail-safe 화이트리스트: role 미설정(null/undefined) 이거나 정확히 'admin' 인 경우만
  // 전체 어드민 접근 허용 (기존 무설정 계정 보존). 그 외 비어있지 않은 모든 role
  // (exec / 'executive' 오타 / 'viewer' 등 신규 티어 포함) 은 세일즈 전용으로 제한.
  // 화이트리스트 외 명칭이 마진·AR 등 전체 접근으로 새지 않도록 안전하게 떨어뜨린다.
  const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role as string | undefined
  const isFullAdmin = !role || role === 'admin'

  // 로그인 페이지 접근 시
  if (pathname === '/admin/login') {
    // 이미 로그인되어 있으면 대시보드로 리다이렉트
    // (전체 어드민 → /admin, 제한 대상 → 세일즈 보드)
    if (user) {
      return NextResponse.redirect(new URL(isFullAdmin ? '/admin' : '/admin/sales', request.url))
    }
    // 세션이 없으면 로그인 페이지 접근 허용
    return response
  }

  // 다른 /admin 경로 접근 시
  // 세션이 없으면 로그인 페이지로 리다이렉트
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 역할 게이트: 전체 어드민이 아닌 제한 대상은 /admin/sales 만 접근
  // (마진·AR 등 /admin/projects 차단). fail-safe — 미설정/admin 만 통과.
  if (!isFullAdmin && !pathname.startsWith('/admin/sales')) {
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
