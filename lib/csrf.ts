/**
 * CSRF (Cross-Site Request Forgery) 보호 유틸리티
 *
 * SameSite 쿠키와 커스텀 헤더를 사용한 이중 방어
 */

import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * CSRF 토큰 생성 (랜덤 32바이트 hex)
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * CSRF 토큰을 쿠키에 설정
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  })

  return token
}

/**
 * CSRF 토큰 검증
 *
 * @param request - Next.js 요청 객체
 * @returns 검증 성공 여부
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  try {
    // 헤더에서 토큰 가져오기
    const headerToken = request.headers.get(CSRF_HEADER_NAME)

    if (!headerToken) {
      console.warn('[CSRF] Token missing in header')
      return false
    }

    // 쿠키에서 토큰 가져오기
    const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value

    if (!cookieToken) {
      console.warn('[CSRF] Token missing in cookie')
      return false
    }

    // 토큰 일치 여부 확인
    if (headerToken !== cookieToken) {
      console.warn('[CSRF] Token mismatch')
      return false
    }

    return true
  } catch (error) {
    console.error('[CSRF] Verification error:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * 클라이언트에서 사용할 CSRF 토큰 가져오기
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value
}
