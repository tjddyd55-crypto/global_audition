import { isNewUpload, NEW_UPLOAD_WINDOW_MS } from '../newUpload'

describe('isNewUpload', () => {
  const now = Date.parse('2026-10-23T00:00:00Z')

  it('marks a video from the last seven days', () => {
    expect(isNewUpload(new Date(now - 60_000).toISOString(), now)).toBe(true)
    expect(isNewUpload(new Date(now - NEW_UPLOAD_WINDOW_MS).toISOString(), now)).toBe(false)
    expect(isNewUpload(null, now)).toBe(false)
  })
})
