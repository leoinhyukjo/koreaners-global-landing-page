/**
 * KR/JP UI 번역. JSON 파일 기반. 영어(Service, Creator, Portfolio, Blog, KOREANERS 등)는 번역하지 않고 원문 유지.
 */
import ko from '@/locales/ko.json'
import jp from '@/locales/jp.json'

const translations = { ko, ja: jp } as const

export type TranslationKey = keyof typeof ko

export function getTranslation(locale: 'ko' | 'ja', key: TranslationKey): string {
  const dict = translations[locale]
  const fallback = translations.ko[key]
  return (dict && key in dict ? (dict as Record<string, string>)[key] : fallback) ?? (typeof fallback === 'string' ? fallback : '')
}

/** Hook/component용: t('key') 형태로 사용 */
export function useTranslations(locale: 'ko' | 'ja') {
  return (key: TranslationKey) => getTranslation(locale, key)
}
