import { readApiErrorMessage, unwrapData } from './unwrap'

describe('unwrapData', () => {
  it('success envelope에서 data를 꺼낸다', () => {
    expect(unwrapData({ success: true, data: { id: '1' } })).toEqual({ id: '1' })
  })

  it('레거시 래핑 없는 본문을 그대로 반환한다', () => {
    expect(unwrapData({ token: 'abc' })).toEqual({ token: 'abc' })
  })

  it('실패 메시지를 읽는다', () => {
    expect(readApiErrorMessage({ success: false, message: '불가' }, 'fallback')).toBe('불가')
  })
})
