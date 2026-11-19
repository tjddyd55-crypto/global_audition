import { nativeRouteForNotification } from './notificationRoute'

describe('nativeRouteForNotification', () => {
  it('maps applicant casting and channel links to native screens', () => {
    expect(nativeRouteForNotification({ link: '/my/studio/casting/abc-1' })).toBe('/casting/abc-1')
    expect(nativeRouteForNotification({ link: '/channel/u-1' })).toBe('/channel/u-1')
  })
  it('opens agency casting pages in the web shell and ignores unknown or external links', () => {
    expect(nativeRouteForNotification({ link: '/my/casting/o-1' }, 'mn')).toEqual({ pathname: '/web', params: { path: '/mn/my/casting/o-1' } })
    expect(nativeRouteForNotification({ link: 'https://evil.example/x' })).toBeNull()
    expect(nativeRouteForNotification({ link: '/admin/super' })).toBeNull()
    expect(nativeRouteForNotification({})).toBeNull()
  })
})
