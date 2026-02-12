/**
 * 블로그 포스트 검증 스키마 (Zod)
 *
 * XSS 패턴 감지 및 입력 길이 제한
 */

import { z } from 'zod'

// XSS 패턴 감지 정규식
const XSS_PATTERN = /<script|javascript:|onerror=|onload=|eval\(|expression\(/i

export const blogPostSchema = z.object({
  title: z.string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자를 초과할 수 없습니다')
    .refine(
      (val) => !XSS_PATTERN.test(val),
      '제목에 허용되지 않는 패턴이 감지되었습니다.'
    ),

  slug: z.string()
    .min(3, '슬러그는 최소 3자 이상이어야 합니다')
    .max(100, '슬러그는 100자를 초과할 수 없습니다')
    .regex(
      /^[a-z0-9-]+$/,
      '슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다'
    ),

  category: z.enum(
    ['업계 동향', '최신 트렌드', '전문가 인사이트', '마케팅 뉴스'],
    {
      errorMap: () => ({ message: '유효한 카테고리를 선택해주세요' }),
    }
  ),

  summary: z.string()
    .max(300, '요약은 300자를 초과할 수 없습니다')
    .refine(
      (val) => !XSS_PATTERN.test(val),
      '요약에 허용되지 않는 패턴이 감지되었습니다.'
    )
    .optional(),

  metaTitle: z.string()
    .max(60, 'Meta Title은 60자를 초과할 수 없습니다 (SEO 최적화)')
    .refine(
      (val) => !XSS_PATTERN.test(val),
      'Meta Title에 허용되지 않는 패턴이 감지되었습니다.'
    )
    .optional(),

  metaDescription: z.string()
    .max(160, 'Meta Description은 160자를 초과할 수 없습니다 (SEO 최적화)')
    .refine(
      (val) => !XSS_PATTERN.test(val),
      'Meta Description에 허용되지 않는 패턴이 감지되었습니다.'
    )
    .optional(),

  thumbnailUrl: z.string()
    .url('올바른 URL 형식이 아닙니다')
    .max(500, 'URL이 너무 깁니다')
    .optional(),

  content: z.string()
    .min(1, '본문 내용을 입력해주세요'),

  published: z.boolean(),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>
