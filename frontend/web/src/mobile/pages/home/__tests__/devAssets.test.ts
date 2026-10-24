import { DEV_AUDITION_THUMBNAILS, devAuditionThumbnail } from '../devAssets'

describe('devAuditionThumbnail', () => {
  it('is deterministic per id and within the dev asset set', () => {
    const ids = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', '7f29243c-fe12-4c11-a472-38bd98b63bdc']
    for (const id of ids) {
      expect(devAuditionThumbnail(id)).toBe(devAuditionThumbnail(id))
      expect(DEV_AUDITION_THUMBNAILS).toContain(devAuditionThumbnail(id))
      expect(devAuditionThumbnail(id).startsWith('/dev-assets/')).toBe(true)
    }
    expect(new Set(ids.map(devAuditionThumbnail)).size).toBeGreaterThan(1)
  })
})
