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

/** 시트 행(배열)을 Supabase 레코드 객체로 변환. C열 빈 행은 null 반환. */
export function parseSheetRow(row: string[]): Record<string, unknown> | null {
  const code = row[2]?.trim()
  if (!code) return null

  return {
    row_code: code,
    entry_date: parseEntryDate(row[0]),
    week_code: row[1]?.trim() || null,
    company_name: row[3]?.trim() || null,
    brand_name: row[4]?.trim() || null,
    name: row[4]?.trim() || row[3]?.trim() || code,
    status: row[5]?.trim() || null,
    project_type: row[6]?.trim() || null,
    media: row[7]?.trim() || null,
    assignee_names: parseAssignees(row[9]),
    assignee_sub: parseAssignees(row[10]),
    start_date: parseDate(row[11]),
    end_date: parseDate(row[12]),
    note: row[13]?.trim() || null,
    contract_krw: parseMoney(row[15]),
    contract_jpy: parseMoney(row[16]),
    collab_fee: parseMoney(row[17]),
    expense_krw: parseMoney(row[18]),
    expense_jpy: parseMoney(row[19]),
    margin_krw: parseMoney(row[20]),
    margin_jpy: parseMoney(row[21]),
    estimate_status: row[23]?.trim() || null,
    contract_status: row[24]?.trim() || null,
    contract_date: parseDate(row[25]),
    settlement_due_date: parseDate(row[26]),
    advance_paid_date: parseDate(row[27]),
    balance_paid_date: parseDate(row[28]),
    contract_cost: parseMoney(row[29]),
    tax_invoice_date: parseDate(row[30]),
    payment_status: row[31]?.trim() || null,
    remittance_status: row[32]?.trim() || null,
    creator_settlement_note: row[34]?.trim() || null,
  }
}
