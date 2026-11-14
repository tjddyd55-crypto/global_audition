import { isRenderablePosterUri } from './auditionImages'

describe('isRenderablePosterUri', () => {
  it('rejects the web-only relative svg placeholder and other relative paths', () => {
    expect(isRenderablePosterUri('/audition-cover-placeholder.svg')).toBe(false)
    expect(isRenderablePosterUri('images/cover.jpg')).toBe(false)
    expect(isRenderablePosterUri('')).toBe(false)
    expect(isRenderablePosterUri(null)).toBe(false)
  })

  it('rejects absolute svg urls (RN Image cannot draw svg)', () => {
    expect(isRenderablePosterUri('https://cdn.test/a/cover.svg')).toBe(false)
    expect(isRenderablePosterUri('https://cdn.test/a/cover.SVG?v=1')).toBe(false)
    expect(isRenderablePosterUri('data:image/svg+xml;base64,AAAA')).toBe(false)
  })

  it('keeps normal raster urls (R2, unsplash)', () => {
    expect(isRenderablePosterUri('https://pub-x.r2.dev/auditions/a.png')).toBe(true)
    expect(isRenderablePosterUri('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4')).toBe(true)
    expect(isRenderablePosterUri('data:image/png;base64,AAAA')).toBe(true)
  })
})
