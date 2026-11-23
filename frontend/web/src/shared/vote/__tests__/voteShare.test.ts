import { facebookShareUrl, parseShareParams, smsShareUrl, voteSharePath, voteShareUrl } from '../voteShare'

const A = '4c715209-1111-2222-3333-444455556666'

describe('voteShare', () => {
  it('fixes audition, round and candidate in the link', () => {
    expect(voteSharePath('aud-1', 3, A)).toBe(`/auditions/aud-1/vote?round=3&candidate=${A}`)
    expect(voteShareUrl('https://x.app/', 'ko', 'aud-1', 3, A)).toBe(`https://x.app/ko/auditions/aud-1/vote?round=3&candidate=${A}`)
    // 언어만 바뀌고 후보·회차는 그대로
    expect(voteShareUrl('https://x.app', 'en', 'aud-1', 3, A).replace('/en/', '/ko/')).toBe(voteShareUrl('https://x.app', 'ko', 'aud-1', 3, A))
  })

  it('builds official sharer and sms urls', () => {
    expect(facebookShareUrl('https://x.app/ko/a?b=1')).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fx.app%2Fko%2Fa%3Fb%3D1')
    expect(smsShareUrl('hi', 'https://x.app')).toBe('sms:?&body=hi%0Ahttps%3A%2F%2Fx.app')
  })

  it('drops tampered params', () => {
    expect(parseShareParams('3', A)).toEqual({ round: 3, candidate: A })
    expect(parseShareParams('abc', "x' or 1=1")).toEqual({ round: null, candidate: null })
    expect(parseShareParams('-1', undefined)).toEqual({ round: null, candidate: null })
  })
})
