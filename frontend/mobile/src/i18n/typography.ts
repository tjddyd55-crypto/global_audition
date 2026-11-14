/**
 * 크메르어는 자음 위·아래로 모음과 받침(coeng)이 쌓여 라틴/한글보다 세로 공간이 더 필요하다.
 * 글자 크기는 줄이지 않고 줄 높이만 늘려 결합 문자가 잘리지 않게 한다.
 */
export const TALL_SCRIPT_LOCALES: readonly string[] = ['km']

/** 크메르어 줄 높이 배수. Noto Sans Khmer(안드로이드 시스템 폰트) 기준. */
export const TALL_SCRIPT_LINE_HEIGHT_RATIO = 1.75

export function isTallScriptLocale(locale?: string | null): boolean {
  const language = (locale ?? '').trim().toLowerCase().split(/[-_]/)[0]
  return TALL_SCRIPT_LOCALES.includes(language)
}

/** 기본 줄 높이를 유지하되, 크메르어면 글자 크기 × 1.75 이상으로 올린다. */
export function scriptLineHeight(locale: string | null | undefined, fontSize: number, base: number): number {
  if (!isTallScriptLocale(locale)) return base
  return Math.max(base, Math.ceil(fontSize * TALL_SCRIPT_LINE_HEIGHT_RATIO))
}
