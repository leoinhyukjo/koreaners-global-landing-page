/** 금액 문자열 → 숫자. ₩, ¥, 쉼표 제거 후 parseFloat. NaN이면 0. */
export function parseMoney(raw: string | undefined | null): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[₩¥\\,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/** 날짜 문자열 → ISO date (YYYY-MM-DD) 또는 null.
 *  지원 형식: "2026. 1. 1", "2026.01.31", "2026/01/31" */
export function parseDate(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null
  const m = raw.match(/(\d{4})[.\s/]+(\d{1,2})[.\s/]+(\d{1,2})/)
  if (!m) return null
  const yyyy = m[1]
  const mm = m[2].padStart(2, '0')
  const dd = m[3].padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** A열 날짜 파싱: "2026-03-16 월" → "2026-03-16" */
export function parseEntryDate(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null
  const dateStr = raw.split(' ')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return parseDate(dateStr)
}

/** 담당자 문자열 → 배열. 쉼표 split + trim + 빈 문자열 필터 */
export function parseAssignees(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}
