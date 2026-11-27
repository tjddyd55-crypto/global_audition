import { publicAppLink } from './publicAppLink'
import { pushDestination } from '../features/notifications/pushDestination'

const origin = 'https://frontend-develop-3d3e.up.railway.app'
const audition = 'aaaa0000-1111-2222-3333-444444444444'
const candidate = 'bbbb0000-1111-2222-3333-444444444444'

it.each(['ko', 'en', 'mn', 'km', 'uz', 'zh-CN', 'zh-TW', 'ja'])('keeps shared candidate, round, and locale %s', locale => {
  const route = publicAppLink(`${origin}/${locale}/auditions/${audition}/vote?round=3&candidate=${candidate}`, origin)
  expect(route).toBe(`/auditions/${audition}/vote?linkLocale=${locale}&round=3&candidate=${candidate}`)
})

it('accepts the existing zh link and public channel, and ignores private and foreign links', () => {
  expect(publicAppLink(`${origin}/zh/channel/${audition}`, origin)).toBe(`/channel/${audition}?linkLocale=zh-CN`)
  expect(publicAppLink(`${origin}/ko/my/applications/${audition}`, origin)).toBe('/')
  expect(publicAppLink(`https://example.test/ko/auditions/${audition}`, origin)).toBe('/')
  expect(publicAppLink('globalaudition://payments/success', origin)).toBe('globalaudition://payments/success')
})

it('allows only supported push destinations and converts the web casting route', () => {
  expect(pushDestination(`/applications/${audition}`)).toBe(`/applications/${audition}`)
  expect(pushDestination(`/my/studio/casting/${candidate}`)).toBe(`/casting/${candidate}`)
  expect(pushDestination('//example.test')).toBeUndefined()
  expect(pushDestination('/admin/super')).toBeUndefined()
})
