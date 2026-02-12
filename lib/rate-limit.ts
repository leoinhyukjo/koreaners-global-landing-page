/**
 * Rate Limiting 유틸리티
 *
 * 메모리 기반 Rate Limiting (단일 서버 환경)
 * 프로덕션 환경에서는 Upstash Redis 사용 권장
 *
 * Upstash 설정 방법:
 * 1. https://upstash.com/ 에서 Redis 데이터베이스 생성
 * 2. .env.local에 추가:
 *    UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=xxx
 * 3. 패키지 설치: npm install @upstash/redis @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// 메모리 기반 저장소 (서버 재시작 시 초기화됨)
const memoryStore = new Map<string, RateLimitEntry>()

// 정리 간격 (10분마다 만료된 엔트리 제거)
const CLEANUP_INTERVAL = 10 * 60 * 1000
let lastCleanup = Date.now()

/**
 * 만료된 엔트리 정리
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }

  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetAt) {
      memoryStore.delete(key)
    }
  }

  lastCleanup = now
}

export interface RateLimitConfig {
  /** 윈도우 기간 (밀리초) */
  windowMs: number
  /** 최대 요청 수 */
  maxRequests: number
}

export interface RateLimitResult {
  /** 허용 여부 */
  success: boolean
  /** 최대 요청 수 */
  limit: number
  /** 남은 요청 수 */
  remaining: number
  /** 리셋 시간 (Unix timestamp) */
  reset: number
}

/**
 * Rate Limit 검사
 *
 * @param identifier - 고유 식별자 (IP 주소, 사용자 ID 등)
 * @param config - Rate Limit 설정
 * @returns Rate Limit 결과
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {
    windowMs: 60 * 1000, // 1분
    maxRequests: 5, // 분당 5회
  }
): RateLimitResult {
  cleanupExpiredEntries()

  const now = Date.now()
  const key = identifier
  const entry = memoryStore.get(key)

  // 첫 요청이거나 윈도우가 만료된 경우
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    memoryStore.set(key, newEntry)

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: newEntry.resetAt,
    }
  }

  // 요청 수 증가
  entry.count++

  // 한도 초과
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetAt,
    }
  }

  // 허용
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetAt,
  }
}

/**
 * IP 주소 추출 (Vercel, Cloudflare 등 프록시 지원)
 */
export function getClientIp(request: Request): string {
  const headers = request.headers

  // Vercel
  const vercelIp = headers.get('x-real-ip') || headers.get('x-forwarded-for')
  if (vercelIp) {
    return vercelIp.split(',')[0].trim()
  }

  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }

  // 기본값
  return 'unknown'
}

/**
 * Rate Limit 응답 헤더 추가
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    response.headers.set('Retry-After', retryAfter.toString())
  }

  return response
}
