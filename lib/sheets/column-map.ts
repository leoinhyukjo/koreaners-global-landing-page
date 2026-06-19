import headerMap from './header-map.json'
import { parseMoney, parseDate, parseEntryDate, parseAssignees } from './parsers'

type FieldType = 'text' | 'date' | 'money' | 'assignees' | 'entry_date'

interface FieldDef {
  field: string
  type: FieldType
}

const HEADER_FIELD_MAP: Record<string, FieldDef> = headerMap as Record<string, FieldDef>

const REQUIRED_HEADERS = ['유니크코드', '브랜드명']

/**
 * 헤더 셀 → FieldDef 조회. exact 일치 우선, 실패 시 관용 매칭.
 * 사람이 헤더 셀에 안내문을 붙이는 경우(예: `유니크코드 ... "직접입력"`)가 잦아
 * exact-match 만으로는 동기화가 반복적으로 깨졌다(2026-06-19 유니크코드 사고).
 * 관용 규칙: 알려진 헤더명으로 시작하고 그 다음 문자가 글자/숫자가 아닌 경계
 * (공백·구두점·줄바꿈·끝)면 그 헤더로 인정. 가장 긴 키 우선(짧은 키 오탐 방지).
 */
function lookupHeaderDef(header: string): FieldDef | undefined {
  const exact = HEADER_FIELD_MAP[header]
  if (exact) return exact
  let best: { len: number; def: FieldDef } | undefined
  for (const key of Object.keys(HEADER_FIELD_MAP)) {
    if (!header.startsWith(key)) continue
    const next = header.charAt(key.length)
    const boundary = next === '' || !/[\p{L}\p{N}]/u.test(next)
    if (boundary && (!best || key.length > best.len)) {
      best = { len: key.length, def: HEADER_FIELD_MAP[key] }
    }
  }
  return best?.def
}

/**
 * 헤더 행에서 { supabaseField → columnIndex } 맵을 빌드한다.
 * 필수 컬럼이 누락되면 에러를 throw한다.
 */
export function buildIndexMap(headerRow: string[]): Map<string, { index: number; type: FieldType }> {
  const map = new Map<string, { index: number; type: FieldType }>()

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i]?.trim()
    if (!header) continue
    const def = lookupHeaderDef(header)
    if (def && !map.has(def.field)) {
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

  // row_code 가 있으면 무조건 sync 대상. 없으면 법인명/브랜드명 둘 다 비어야 빈 행으로 간주.
  const companyName = get('company_name')
  const brandName = get('brand_name')
  const rowCodeRaw = get('row_code')
  if (!rowCodeRaw && !companyName && !brandName) return null

  const record: Record<string, unknown> = {}
  for (const [field] of indexMap) {
    record[field] = getTyped(field)
  }

  // row_code: 유니크코드 칼럼 값 사용 (없으면 행 번호 폴백)
  if (!record.row_code) {
    record.row_code = `R${rowNumber}`
  }
  // name 필드: brand_name > company_name
  record.name = brandName || companyName

  return record
}
