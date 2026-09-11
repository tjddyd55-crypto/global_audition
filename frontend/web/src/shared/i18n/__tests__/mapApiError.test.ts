import { mapApiErrorCode } from '../mapApiError'
import ko from '../../../../messages/ko.json'

describe('mapApiErrorCode', () => {
  const t = (key: string) => {
    const [ns, name] = key.split('.')
    const tree = ko as Record<string, Record<string, string>>
    return tree[ns]?.[name] ?? key
  }

  it('prefers INSUFFICIENT_CREDITS catalog copy over server Korean', () => {
    expect(mapApiErrorCode({ code: 'INSUFFICIENT_CREDITS', message: '크레딧이 부족합니다.' }, t, 'fallback')).toBe(
      ko.errors.INSUFFICIENT_CREDITS,
    )
  })
})
