export const DEFAULT_THUMBNAIL_SRC = '/placeholder.jpg'

function isAbsoluteUrl(src: string) {
  return src.startsWith('http://') || src.startsWith('https://')
}

function isSpecialUrl(src: string) {
  return (
    isAbsoluteUrl(src) ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('about:')
  )
}

/**
 * Normalize a thumbnail src for Next.js Image / <img>.
 * - null/empty -> DEFAULT_THUMBNAIL_SRC
 * - "images/blog/a.jpg" -> "/images/blog/a.jpg"
 * - "public/images/blog/a.jpg" -> "/images/blog/a.jpg"
 * - "https://..." stays as-is
 */
export function resolveThumbnailSrc(src?: string | null): string {
  const trimmed = (src ?? '').trim()
  if (!trimmed) return DEFAULT_THUMBNAIL_SRC
  if (isSpecialUrl(trimmed)) return trimmed

  let normalized = trimmed
    .replace(/^\.\/+/, '')
    .replace(/^public\//, '')

  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  return normalized
}

export function toAbsoluteUrl(siteUrl: string, src: string): string {
  if (!src) return siteUrl
  if (isAbsoluteUrl(src)) return src
  const base = siteUrl.replace(/\/$/, '')
  const path = src.startsWith('/') ? src : `/${src}`
  return `${base}${path}`
}

