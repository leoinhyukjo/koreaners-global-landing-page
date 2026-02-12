import { NextResponse } from 'next/server'
import { setCsrfToken, getCsrfToken } from '@/lib/csrf'

/**
 * CSRF 토큰 제공 API
 *
 * GET 요청 시:
 * - 기존 토큰이 있으면 반환
 * - 없으면 새로 생성하여 쿠키에 설정하고 반환
 */
export async function GET() {
  try {
    // 기존 토큰 확인
    let token = await getCsrfToken()

    // 토큰이 없으면 새로 생성
    if (!token) {
      token = await setCsrfToken()
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('[CSRF Token API] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'CSRF 토큰 생성 실패' },
      { status: 500 }
    )
  }
}
