import ko from '../../../../web/messages/ko.json'
import en from '../../../../web/messages/en.json'
import mn from '../../../../web/messages/mn.json'
import km from '../../../../web/messages/km.json'
import uz from '../../../../web/messages/uz.json'
import { AUDIENCE_FILTER_OPTIONS } from '../../domain/audience'
import { chipFrameFor, chipRevealOffset, COUNTRY_CHIP_ROW, COUNTRY_FILTER_AXIS } from './chipLayout'

type FilterCatalog = {
  auditions: { filterAll: string }
  country: Record<Exclude<(typeof AUDIENCE_FILTER_OPTIONS)[number], 'ALL'>, string>
}

const CATALOGS = [ko, en, mn, km, uz] as FilterCatalog[]

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
describe('chipRevealOffset', () => {
  const base = { viewportWidth: 360, contentWidth: 760, currentOffset: 0, margin: 16 }
  it('scrolls right so an off-screen KH/UZ chip is fully visible', () => {
    expect(chipRevealOffset({ ...base, chipX: 500, chipWidth: 120 })).toBe(500 + 120 + 16 - 360)
  })
  it('keeps the current position when the chip is already visible', () => {
    expect(chipRevealOffset({ ...base, chipX: 100, chipWidth: 80 })).toBeNull()
  })
  it('scrolls back left for a chip before the viewport, clamped to 0', () => {
    expect(chipRevealOffset({ ...base, currentOffset: 300, chipX: 0, chipWidth: 60 })).toBe(0)
  })
  it('never scrolls past the content end', () => {
    expect(chipRevealOffset({ ...base, chipX: 700, chipWidth: 60 })).toBe(400)
  })
  it('does nothing before layout is known', () => {
    expect(chipRevealOffset({ ...base, viewportWidth: 0, chipX: 500, chipWidth: 120 })).toBeNull()
  })
})
