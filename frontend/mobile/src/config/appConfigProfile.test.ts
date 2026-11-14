import { PROFILE_WEB_URLS, resolveWebUrl } from '../../app.config'

describe('app.config profile web url', () => {
  it('preview profile without EXPO_PUBLIC_* uses the Development frontend (not Production)', () => {
    expect(resolveWebUrl({ EAS_BUILD_PROFILE: 'preview' })).toBe('https://frontend-develop-3d3e.up.railway.app')
  })

  it('explicit EXPO_PUBLIC_WEB_URL still wins', () => {
    expect(resolveWebUrl({ EAS_BUILD_PROFILE: 'preview', EXPO_PUBLIC_WEB_URL: 'http://10.0.2.2:3000' })).toBe('http://10.0.2.2:3000')
  })

  it('production / unknown profiles keep the existing default', () => {
    expect(resolveWebUrl({ EAS_BUILD_PROFILE: 'production' })).toBe('https://frontend-production-8613a.up.railway.app')
    expect(resolveWebUrl({})).toBe('https://frontend-production-8613a.up.railway.app')
  })

  it('preview default matches eas.json preview env', () => {
    const eas = require('../../eas.json') as { build: Record<string, { env?: Record<string, string> }> }
    expect(PROFILE_WEB_URLS.preview).toBe(eas.build.preview.env?.EXPO_PUBLIC_WEB_URL)
  })
})
