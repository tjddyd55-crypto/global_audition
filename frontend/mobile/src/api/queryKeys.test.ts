import { queryKeys } from './queryKeys'

describe('audition query keys', () => {
  it('changes the list key when locale or audience changes', () => {
    const ko = queryKeys.auditionsOpen('KR', 'ko')
    const en = queryKeys.auditionsOpen('KR', 'en')
    const mn = queryKeys.auditionsOpen('MN', 'ko')
    expect(ko).toEqual(['auditions', 'open', 'KR', 'ko'])
    expect(en).not.toEqual(ko)
    expect(mn).not.toEqual(ko)
  })

  it('changes the detail key when the content locale changes', () => {
    expect(queryKeys.audition('aud-1', 'ko')).toEqual(['auditions', 'aud-1', 'ko'])
    expect(queryKeys.audition('aud-1', 'en')).not.toEqual(queryKeys.audition('aud-1', 'ko'))
  })

  it('leaves the vote category sentinel out of the audition list key', () => {
    expect(queryKeys.auditionsOpen('ALL', 'mn').join('|')).not.toContain('전체')
    expect(queryKeys.votes('aud-1')).toEqual(['auditions', 'aud-1', 'votes'])
  })
})
