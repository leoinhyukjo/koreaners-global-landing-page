/**
 * API 클라이언트 헬퍼
 *
 * CSRF 토큰을 자동으로 포함하는 fetch wrapper
 */

let csrfToken: string | null = null

/**
 * CSRF 토큰 가져오기 (캐싱)
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken
  }

  try {
    const response = await fetch('/api/csrf-token')
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token')
    }
    const data = await response.json()
    const token = data.token as string
    if (!token) {
      throw new Error('CSRF token not found in response')
    }
    csrfToken = token
    return token
  } catch (error) {
    console.error('[API Client] CSRF token fetch failed:', error)
    throw error
  }
}

/**
 * CSRF 토큰이 포함된 POST 요청
 *
 * @param url - API 엔드포인트 URL
 * @param data - 요청 바디 데이터
 * @param options - 추가 fetch 옵션
 */
export async function postWithCsrf<T = any>(
  url: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = await getCsrfToken()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[API Client] Request failed:', error)
    throw error
  }
}

/**
 * CSRF 토큰 캐시 무효화
 * (로그아웃 시 등)
 */
export function clearCsrfToken() {
  csrfToken = null
}
