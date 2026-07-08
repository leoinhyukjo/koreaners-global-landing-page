/**
 * 블로그 카테고리별 정적 셰이더 아트 매핑 + 카드 썸네일 폴백.
 * 아트 에셋은 scripts/bake-blog-art.mjs 가 /dev/blog-art 를 베이크해 public/blog-art/<slug>.jpg 로 생성.
 */

export type BlogArtCategory = {
  slug: string
  /** 이 아트 slug 에 매핑되는 실제 blog.category 문자열 (정확 일치) */
  match: string[]
  colors: [string, string]
  frame: number
}

// 색은 기존 토큰만 (#FF4500 / #F59E0B / #0D9488). frame 으로 컷을 달리해 카테고리별 변주.
export const BLOG_ART_CATEGORIES: BlogArtCategory[] = [
  { slug: 'expert-insight', match: ['전문가 인사이트'], colors: ['#FF4500', '#F59E0B'], frame: 12000 },
  { slug: 'latest-trend', match: ['최신 트렌드'], colors: ['#F59E0B', '#FF4500'], frame: 47000 },
  { slug: 'industry-trend', match: ['업계 동향'], colors: ['#FF4500', '#0D9488'], frame: 83000 },
  { slug: 'default', match: [], colors: ['#FF4500', '#0D9488'], frame: 61000 },
]

export function blogArtSlug(category?: string | null): string {
  const c = category?.trim()
  if (c) {
    const hit = BLOG_ART_CATEGORIES.find((x) => x.match.includes(c))
    if (hit) return hit.slug
  }
  return 'default'
}

export function blogArtSrc(category?: string | null): string {
  return `/blog-art/${blogArtSlug(category)}.jpg`
}

/**
 * 현재 모든 포스트가 공유하는 제네릭 로고 썸네일 해시.
 * 이 마커에 해당하면 고유 썸네일이 아니므로 카테고리 아트로 대체한다.
 */
const GENERIC_THUMBNAIL_MARKERS = [
  'e4f73c02beccdc70beae3d049da73f7d6566d6b4c0de5d2477bbde74c7cb1a60',
]

export function isGenericBlogThumbnail(url?: string | null): boolean {
  if (!url || !url.trim()) return true
  return GENERIC_THUMBNAIL_MARKERS.some((m) => url.includes(m))
}
