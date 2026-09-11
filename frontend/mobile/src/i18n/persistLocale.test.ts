import { detectDeviceLocale, PRIMARY_LOCALES } from './runtime'

describe('native locale persistence contract', () => {
  it('keeps only ko/en/mn as profile-switchable locales', () => {
    expect(PRIMARY_LOCALES).toEqual(['ko', 'en', 'mn'])
  })

  it('detects device mn and falls back to en otherwise', () => {
    expect(detectDeviceLocale('mn')).toBe('mn')
    expect(detectDeviceLocale('ko-KR')).toBe('ko')
    expect(detectDeviceLocale('en-US')).toBe('en')
    expect(detectDeviceLocale('ja-JP')).toBe('en')
    expect(detectDeviceLocale(undefined)).toBe('en')
  })
})
