import en from '../../../../messages/en.json'
import ko from '../../../../messages/ko.json'
import mn from '../../../../messages/mn.json'
import { RECRUIT_FIELD_CODES, recruitFieldLabels, toRecruitFieldCode } from '../recruitFields'

const cat = (m: Record<string, unknown>) => (k: string) => (m.recruitField as Record<string, string>)[k] ?? `recruitField.${k}`

describe('recruitFields', () => {
  it('every code has a label in ko/en/mn', () => {
    for (const m of [ko, en, mn]) {
      for (const c of RECRUIT_FIELD_CODES) expect((m as any).recruitField[c]).toBeTruthy()
    }
  })
  it('maps legacy Korean/English values to codes', () => {
    expect(toRecruitFieldCode('보컬')).toBe('VOCAL')
    expect(toRecruitFieldCode(' Dance ')).toBe('DANCE')
    expect(toRecruitFieldCode('VOCAL')).toBe('VOCAL')
    expect(toRecruitFieldCode('요리')).toBeNull()
  })
  it('renders localized labels, keeps unknown free text, dedupes', () => {
    expect(recruitFieldLabels(['보컬', 'VOCAL', '댄스', '랩'], cat(en))).toEqual(['Vocal', 'Dance', 'Rap'])
    expect(recruitFieldLabels(['VOCAL', 'DANCE'], cat(mn))).toEqual(['Дуу', 'Бүжиг'])
    expect(recruitFieldLabels(['Free text'], cat(en))).toEqual(['Free text'])
  })
})
