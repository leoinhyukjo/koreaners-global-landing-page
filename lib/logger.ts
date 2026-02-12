/**
 * 로깅 유틸리티
 *
 * 환경별로 로그 레벨을 제어하고, 프로덕션에서는 민감한 정보를 노출하지 않습니다.
 *
 * 사용법:
 * ```typescript
 * import { logger } from '@/lib/logger'
 *
 * logger.log('일반 로그')
 * logger.info('정보성 메시지')
 * logger.warn('경고')
 * logger.error('에러 발생', error)
 * logger.debug('디버그 정보', data)
 * ```
 *
 * 프로덕션 환경 설정:
 * - console.log, console.debug는 자동으로 제거됨
 * - console.error, console.warn만 Sentry 등으로 전송 권장
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * 민감한 정보 마스킹
 */
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const masked = { ...data }
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      masked[key] = '***MASKED***'
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key])
    }
  }

  return masked
}

/**
 * 로거 객체
 */
export const logger = {
  /**
   * 일반 로그 (개발 환경에서만)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * 정보성 메시지 (개발 환경에서만)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  /**
   * 경고 메시지 (모든 환경)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    } else {
      // 프로덕션: Sentry 등으로 전송 권장
      console.warn('[WARN]', ...args.map(maskSensitiveData))
    }
  },

  /**
   * 에러 메시지 (모든 환경)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    } else {
      // 프로덕션: Sentry 등으로 전송 권장
      console.error('[ERROR]', ...args.map(maskSensitiveData))

      // TODO: Sentry 통합
      // Sentry.captureException(args[0])
    }
  },

  /**
   * 디버그 메시지 (개발 환경에서만)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args)
    }
  },

  /**
   * 조건부 로그 (개발 환경에서만)
   */
  logIf: (condition: boolean, ...args: any[]) => {
    if (condition && isDevelopment) {
      console.log(...args)
    }
  },
}

/**
 * 클라이언트/서버 환경 표시
 */
export const logEnvironment = () => {
  logger.info(`Environment: ${process.env.NODE_ENV}`)
  logger.info(`Is Server: ${typeof window === 'undefined'}`)
}

/**
 * 성능 측정 유틸리티
 */
export function measurePerformance<T>(
  label: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  if (!isDevelopment) {
    return fn()
  }

  const start = performance.now()
  const result = fn()

  if (result instanceof Promise) {
    return result.then((value) => {
      const end = performance.now()
      logger.debug(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`)
      return value
    })
  } else {
    const end = performance.now()
    logger.debug(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}
