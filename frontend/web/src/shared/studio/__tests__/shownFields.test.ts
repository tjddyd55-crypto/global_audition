import { initialShownSelection, LEGACY_PUBLIC_FIELDS, PROFILE_SHOWN_FIELDS } from '../shownFields'

describe('channel shown fields', () => {
  it('keeps the profile keys the public read model understands', () => {
    expect(PROFILE_SHOWN_FIELDS).toEqual([
      'NAME',
      'NATIONALITY',
      'RESIDENCE',
      'AGE',
      'LANGUAGES',
      'SHORT_BIO',
      'BIO',
      'INTRO',
      'SPECIALTIES',
      'TALENTS',
      'CAREER',
      'ACTIVITY',
      'SNS',
    ])
    for (const privateByDefault of ['NAME', 'CAREER', 'ACTIVITY', 'RESIDENCE', 'AGE', 'LANGUAGES', 'TALENTS']) {
      expect(LEGACY_PUBLIC_FIELDS).not.toContain(privateByDefault)
    }
  })

  it('uses the legacy public set until the member saves a selection', () => {
    expect(initialShownSelection(undefined, false)).toEqual(LEGACY_PUBLIC_FIELDS)
    expect(initialShownSelection(['CAREER', 'AGE', 'NOPE'], true)).toEqual(['CAREER', 'AGE'])
    expect(initialShownSelection([], true)).toEqual([])
  })
})
