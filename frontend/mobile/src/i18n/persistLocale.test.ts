import { detectDeviceLocale, PRIMARY_LOCALES } from './runtime'

describe('native locale persistence contract', () => {
  it('keeps ko/en/mn/km/uz as switchable locales', () => {
    expect(PRIMARY_LOCALES).toEqual(['ko', 'en', 'mn', 'km', 'uz', 'zh-CN', 'zh-TW'])
  })

  it('detects device mn and falls back to en otherwise', () => {
    expect(detectDeviceLocale('mn')).toBe('mn')
    expect(detectDeviceLocale('ko-KR')).toBe('ko')
    expect(detectDeviceLocale('en-US')).toBe('en')
    expect(detectDeviceLocale('ja-JP')).toBe('en')
    expect(detectDeviceLocale(undefined)).toBe('en')
  })
})
