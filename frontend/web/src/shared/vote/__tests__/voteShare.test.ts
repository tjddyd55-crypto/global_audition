import {
  facebookShareUrl,
  INSTAGRAM_WEB_URL,
  parseShareParams,
  shareMessage,
  voteBoardPath,
  voteSharePath,
  voteShareUrl,
} from '../voteShare'

const A = '4c715209-1111-2222-3333-444455556666'

describe('voteShare', () => {
  it('fixes audition, round and candidate in the link', () => {
    expect(voteSharePath('aud-1', 3, A)).toBe(`/auditions/aud-1/vote?round=3&candidate=${A}`)
    expect(voteShareUrl('https://x.app/', 'ko', 'aud-1', 3, A)).toBe(`https://x.app/ko/auditions/aud-1/vote?round=3&candidate=${A}`)
    // 언어만 바뀌고 후보·회차는 그대로
    expect(voteShareUrl('https://x.app', 'en', 'aud-1', 3, A).replace('/en/', '/ko/')).toBe(voteShareUrl('https://x.app', 'ko', 'aud-1', 3, A))
    // 전체 후보 보기는 후보 파라미터를 떼고 같은 회차만 남긴다
    expect(voteBoardPath('aud-1', 3)).toBe('/auditions/aud-1/vote?round=3')
    expect(voteBoardPath('aud-1')).toBe('/auditions/aud-1/vote')
  })

  it('builds the official Facebook sharer and copies text with the link', () => {
    expect(facebookShareUrl('https://x.app/ko/a?b=1')).toBe(
      'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fx.app%2Fko%2Fa%3Fb%3D1',
    )
    expect(INSTAGRAM_WEB_URL).toBe('https://www.instagram.com/')
    expect(shareMessage('hi', 'https://x.app')).toBe('hi\nhttps://x.app')
    expect(shareMessage('  ', 'https://x.app')).toBe('https://x.app')
  })

  it('drops tampered params', () => {
    expect(parseShareParams('3', A)).toEqual({ round: 3, candidate: A })
    expect(parseShareParams('abc', "x' or 1=1")).toEqual({ round: null, candidate: null })
    expect(parseShareParams('-1', undefined)).toEqual({ round: null, candidate: null })
  })
})
