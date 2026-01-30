import type { Portfolio, BlogPost } from '@/lib/supabase'

export type Locale = 'ko' | 'ja'

/** 포트폴리오 제목 (로케일별) */
export function getPortfolioTitle(p: Portfolio, locale: Locale): string {
  if (locale === 'ja' && p.title_jp?.trim()) return p.title_jp.trim()
  return p.title?.trim() ?? ''
}

/** 포트폴리오 클라이언트명 */
export function getPortfolioClientName(p: Portfolio, locale: Locale): string {
  if (locale === 'ja' && p.client_name_jp?.trim()) return p.client_name_jp.trim()
  return p.client_name?.trim() ?? ''
}

/** 포트폴리오 본문 콘텐츠 */
export function getPortfolioContent(p: Portfolio, locale: Locale): any {
  if (locale === 'ja' && p.content_jp != null) return p.content_jp
  return p.content ?? []
}

/** 블로그 제목 */
export function getBlogTitle(p: BlogPost, locale: Locale): string {
  if (locale === 'ja' && p.title_jp?.trim()) return p.title_jp.trim()
  return p.title?.trim() ?? ''
}

/** 블로그 요약 */
export function getBlogSummary(p: BlogPost, locale: Locale): string | null {
  if (locale === 'ja' && p.summary_jp != null) return p.summary_jp
  return p.summary ?? null
}

/** 블로그 본문 */
export function getBlogContent(p: BlogPost, locale: Locale): any {
  if (locale === 'ja' && p.content_jp != null) return p.content_jp
  return p.content ?? []
}

/** 블로그 meta_title */
export function getBlogMetaTitle(p: BlogPost, locale: Locale): string | null {
  if (locale === 'ja' && p.meta_title_jp != null) return p.meta_title_jp
  return p.meta_title ?? null
}

/** 블로그 meta_description */
export function getBlogMetaDescription(p: BlogPost, locale: Locale): string | null {
  if (locale === 'ja' && p.meta_description_jp != null) return p.meta_description_jp
  return p.meta_description ?? null
}
