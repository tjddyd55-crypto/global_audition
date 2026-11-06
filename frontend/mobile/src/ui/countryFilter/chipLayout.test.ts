import ko from '../../../../web/messages/ko.json'
import en from '../../../../web/messages/en.json'
import mn from '../../../../web/messages/mn.json'
import { AUDIENCE_FILTER_OPTIONS } from '../../domain/audience'
import { chipFrameFor, COUNTRY_CHIP_ROW, COUNTRY_FILTER_AXIS } from './chipLayout'

type FilterCatalog = {
  auditions: { filterAll: string }
  country: Record<'KR' | 'MN' | 'JP' | 'OTHER', string>
}

const CATALOGS = [ko, en, mn] as FilterCatalog[]

function chipLabel(messages: FilterCatalog, option: (typeof AUDIENCE_FILTER_OPTIONS)[number]): string {
  if (option === 'ALL') return messages.auditions.filterAll
  return messages.country[option]
}

describe('country filter chips', () => {
  it('uses one fixed frame for All and every country', () => {
    const frames = AUDIENCE_FILTER_OPTIONS.map((option) => chipFrameFor(option))
    for (const frame of frames) {
      expect(frame).toEqual({ height: 36, paddingHorizontal: 14 })
      expect(frame).not.toHaveProperty('minHeight')
      expect(frame).not.toHaveProperty('paddingVertical')
    }
  })

  it('keeps the row horizontal so longer ko/mn labels are not wrapped', () => {
    expect(COUNTRY_FILTER_AXIS).toBe('horizontal')
    expect(COUNTRY_CHIP_ROW.flexWrap).toBe('nowrap')
    expect(COUNTRY_CHIP_ROW.flexDirection).toBe('row')
    for (const messages of CATALOGS) {
      for (const option of AUDIENCE_FILTER_OPTIONS) {
        const label = chipLabel(messages, option)
        expect(label.length).toBeGreaterThan(0)
        expect(label).not.toMatch(/[\r\n]/)
      }
    }
  })
})