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
 * row_code가 비어있으면 null 반환.
 */
export function parseRowDynamic(
  row: string[],
  indexMap: Map<string, { index: number; type: FieldType }>,
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

  const rowCode = get('row_code')
  if (!rowCode) return null

  const record: Record<string, unknown> = {}
  for (const [field] of indexMap) {
    record[field] = getTyped(field)
  }

  // name 필드: brand_name > company_name > row_code
  record.name = get('brand_name') || get('company_name') || rowCode

  return record
}
