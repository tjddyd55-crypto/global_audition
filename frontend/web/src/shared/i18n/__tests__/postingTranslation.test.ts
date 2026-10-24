import { overlayPosting } from '../postingTranslation'
import type { AuditionDto } from '@/shared/types/audition'

const base = {
  id: 'a1',
  title: 'Нээлттэй #2',
  displayTitle: 'Нээлттэй #2 (2-р шат)',
  description: 'Монгол тайлбар',
  recruitFields: ['VOCAL', 'DANCE'],
  qualifications: ['q'],
} as unknown as AuditionDto

describe('overlayPosting', () => {
  it('keeps catalog recruit codes instead of machine-translated text', () => {
    const shown = overlayPosting(base, { fields: { recruitFields: 'ДУУ ХООЛ\nБҮЖИГ' } } as never)
    expect(shown.recruitFields).toEqual(['VOCAL', 'DANCE'])
  })

  it('original toggle replaces the headline title and keeps the round suffix', () => {
    const shown = overlayPosting(base, { showingOriginal: true, fields: { title: 'Open #2', description: 'Original' } } as never)
    expect(shown.title).toBe('Open #2')
    expect(shown.displayTitle).toBe('Open #2 (2-р шат)')
    expect(shown.description).toBe('Original')
  })

  it('same title leaves displayTitle untouched', () => {
    const shown = overlayPosting(base, { fields: { title: 'Нээлттэй #2' } } as never)
    expect(shown.displayTitle).toBe('Нээлттэй #2 (2-р шат)')
  })
})
