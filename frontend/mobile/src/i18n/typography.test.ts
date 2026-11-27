import { isTallScriptLocale, scriptLineHeight } from './typography'
import { LOCALE_NATIVE_NAMES, PUBLIC_SELECTOR, nativeLanguageName } from './runtime'

describe('script-aware typography', () => {
  it('only raises line height for Khmer, keeping font sizes unchanged', () => {
    expect(isTallScriptLocale('km')).toBe(true)
    expect(isTallScriptLocale('km-KH')).toBe(true)
    expect(isTallScriptLocale('ko')).toBe(false)
    expect(isTallScriptLocale('uz')).toBe(false)
    expect(scriptLineHeight('ko', 11, 16)).toBe(16)
    expect(scriptLineHeight('uz', 14, 18)).toBe(18)
    expect(scriptLineHeight('km', 11, 16)).toBe(20)
    expect(scriptLineHeight('km', 14, 18)).toBe(25)
    // 이미 충분히 높으면 줄이지 않는다.
    expect(scriptLineHeight('km', 10, 30)).toBe(30)
  })
})

describe('language menu', () => {
  it('lists eight languages vertically in their own script', () => {
    expect([...PUBLIC_SELECTOR]).toEqual(['ko', 'en', 'mn', 'km', 'uz', 'zh-CN', 'zh-TW', 'ja'])
    expect(PUBLIC_SELECTOR.map(nativeLanguageName)).toEqual(['한국어', 'English', 'Монгол', 'ខ្មែរ', 'Oʻzbekcha', '简体中文', '繁體中文', '日本語'])
    expect(Object.keys(LOCALE_NATIVE_NAMES)).toEqual(['ko', 'en', 'mn', 'km', 'uz', 'zh-CN', 'zh-TW', 'ja'])
  })
})
