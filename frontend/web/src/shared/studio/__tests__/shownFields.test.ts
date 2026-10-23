import { initialShownSelection, LEGACY_PUBLIC_FIELDS, PROFILE_SHOWN_FIELDS } from '../shownFields'

describe('channel shown fields', () => {
  it('keeps the profile keys the public read model understands', () => {
    expect(PROFILE_SHOWN_FIELDS).toEqual([
      'NAME',
      'NATIONALITY',
      'SHORT_BIO',
      'BIO',
      'INTRO',
      'SPECIALTIES',
      'CAREER',
      'ACTIVITY',
      'SNS',
    ])
    expect(LEGACY_PUBLIC_FIELDS).not.toContain('CAREER')
    expect(LEGACY_PUBLIC_FIELDS).not.toContain('ACTIVITY')
  })

  it('uses the legacy public set until the member saves a selection', () => {
    expect(initialShownSelection(undefined, false)).toEqual(LEGACY_PUBLIC_FIELDS)
    expect(initialShownSelection(['CAREER', 'NOPE'], true)).toEqual(['CAREER'])
    expect(initialShownSelection([], true)).toEqual([])
  })
})