/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Notion 페이지 속성에서 값을 추출하는 공통 헬퍼 함수들
 */

/** title 타입 속성 → plain_text 결합 문자열 */
export function getTitle(props: any, key: string): string {
  const prop = props?.[key];
  if (!prop || prop.type !== "title") return "";
  return (prop.title ?? []).map((t: any) => t.plain_text ?? "").join("");
}

/** rich_text 타입 속성 → plain_text 결합 문자열 */
export function getRichText(props: any, key: string): string {
  const prop = props?.[key];
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text ?? []).map((t: any) => t.plain_text ?? "").join("");
}

/** select 타입 속성 → name 문자열 (없으면 null) */
export function getSelect(props: any, key: string): string | null {
  const prop = props?.[key];
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

/** multi_select 타입 속성 → name 배열 */
export function getMultiSelect(props: any, key: string): string[] {
  const prop = props?.[key];
  if (!prop || prop.type !== "multi_select") return [];
  return (prop.multi_select ?? []).map((s: any) => s.name ?? "").filter(Boolean);
}

/** number 타입 속성 → number (null이면 0) */
export function getNumber(props: any, key: string): number {
  const prop = props?.[key];
  if (!prop || prop.type !== "number") return 0;
  return prop.number ?? 0;
}

/** checkbox 타입 속성 → boolean */
export function getCheckbox(props: any, key: string): boolean {
  const prop = props?.[key];
  if (!prop || prop.type !== "checkbox") return false;
  return prop.checkbox ?? false;
}

/** date 타입 속성 → date.start 문자열 (없으면 null) */
export function getDate(props: any, key: string): string | null {
  const prop = props?.[key];
  if (!prop || prop.type !== "date") return null;
  return prop.date?.start ?? null;
}

/** status 타입 속성 → name 문자열 (없으면 null) */
export function getStatus(props: any, key: string): string | null {
  const prop = props?.[key];
  if (!prop || prop.type !== "status") return null;
  return prop.status?.name ?? null;
}

/** people 타입 속성 → name 배열 */
export function getPeople(props: any, key: string): string[] {
  const prop = props?.[key];
  if (!prop || prop.type !== "people") return [];
  return (prop.people ?? []).map((p: any) => p.name ?? "").filter(Boolean);
}

/** relation 타입 속성 → id 배열 */
export function getRelationIds(props: any, key: string): string[] {
  const prop = props?.[key];
  if (!prop || prop.type !== "relation") return [];
  return (prop.relation ?? []).map((r: any) => r.id ?? "").filter(Boolean);
}

/** formula 타입 속성 → number | string | null */
export function getFormula(props: any, key: string): number | string | null {
  const prop = props?.[key];
  if (!prop || prop.type !== "formula") return null;
  const formula = prop.formula;
  if (!formula) return null;
  switch (formula.type) {
    case "number":
      return formula.number ?? null;
    case "string":
      return formula.string ?? null;
    case "boolean":
      return formula.boolean ? 1 : 0;
    case "date":
      return formula.date?.start ?? null;
    default:
      return null;
  }
}
