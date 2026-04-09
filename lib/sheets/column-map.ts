import headerMap from './header-map.json'
import { parseMoney, parseDate, parseEntryDate, parseAssignees } from './parsers'

type FieldType = 'text' | 'date' | 'money' | 'assignees' | 'entry_date'

interface FieldDef {
  field: string
  type: FieldType
}

const HEADER_FIELD_MAP: Record<string, FieldDef> = headerMap as Record<string, FieldDef>

const REQUIRED_HEADERS = ['코드', '브랜드명']

/**
 * 헤더 행에서 { supabaseField → columnIndex } 맵을 빌드한다.
 * 필수 컬럼이 누락되면 에러를 throw한다.
 */
export function buildIndexMap(headerRow: string[]): Map<string, { index: number; type: FieldType }> {
  const map = new Map<string, { index: number; type: FieldType }>()

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i]?.trim()
    if (!header) continue
    const def = HEADER_FIELD_MAP[header]
    if (def) {
      map.set(def.field, { index: i, type: def.type })
    }
  }

  for (const requiredHeader of REQUIRED_HEADERS) {
    const def = HEADER_FIELD_MAP[requiredHeader]
    if (def && !map.has(def.field)) {
      throw new Error(`필수 컬럼 "${requiredHeader}" (→ ${def.field})이 시트 헤더에 없습니다`)
    }
  }

  return map
}

/**
 * 데이터 행 하나를 indexMap 기반으로 파싱한다.
 * rowNumber: 시트 행 번호 (2부터 시작, 헤더=1)
 * 법인명 또는 브랜드명이 없는 빈 행은 null 반환.
 */
export function parseRowDynamic(
  row: string[],
  indexMap: Map<string, { index: number; type: FieldType }>,
  rowNumber: number,
): Record<string, unknown> | null {
  const get = (field: string): string => {
    const entry = indexMap.get(field)
    if (!entry) return ''
    return (row[entry.index] ?? '').trim()
  }

  const getTyped = (field: string): unknown => {
    const entry = indexMap.get(field)
    if (!entry) return null
    const raw = (row[entry.index] ?? '').trim()
    if (!raw) return entry.type === 'money' ? 0 : entry.type === 'assignees' ? [] : null

    switch (entry.type) {
      case 'text': return raw
      case 'money': return parseMoney(raw)
      case 'date': return parseDate(raw)
      case 'entry_date': return parseEntryDate(raw)
      case 'assignees': return parseAssignees(raw)
      default: return raw
    }
  }

  // 법인명 또는 브랜드명이 없으면 빈 행으로 간주
  const companyName = get('company_name')
  const brandName = get('brand_name')
  if (!companyName && !brandName) return null

  const record: Record<string, unknown> = {}
  for (const [field] of indexMap) {
    record[field] = getTyped(field)
  }

  // row_code: 시트 행 번호 기반 (유니크 키)
  record.row_code = `R${rowNumber}`
  // name 필드: brand_name > company_name
  record.name = brandName || companyName

  return record
}
