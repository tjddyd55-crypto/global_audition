import { displayedField, translationNotice } from '../contentTranslation'

describe('content translation display', () => {
  it('keeps the original when the view locale matches or the provider did not translate', () => {
    expect(displayedField('안녕', { showingOriginal: true, fields: { introText: 'Hello' } }, 'introText', false)).toBe('안녕')
    expect(displayedField('안녕', null, 'introText', false)).toBe('안녕')
    expect(displayedField('안녕', { showingOriginal: false, fields: { introText: 'Hello' } }, 'introText', true)).toBe('안녕')
  })

  it('uses the stored field and marks a stale translation', () => {
    const view = { showingOriginal: false, stale: true, fields: { title: 'Title' } }
    expect(displayedField('제목', view, 'title', false)).toBe('Title')
    expect(translationNotice(view, false)).toBe('stale')
    expect(translationNotice({ showingOriginal: true, fallback: true }, false)).toBe('original')
  })
})
