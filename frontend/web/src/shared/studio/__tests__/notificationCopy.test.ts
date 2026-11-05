import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import { notificationCopy } from '../notificationCopy'

const catalogs = { ko, en, mn } as const

function translate(locale: keyof typeof catalogs, key: string): string {
  const table = catalogs[locale].notifications as Record<string, string>
  const value = table[key]
  if (!value) throw new Error(`missing ${locale} notifications.${key}`)
  return value
}

describe('notificationCopy', () => {
  it('renders a single-stage result in ko, en, and mn from catalog keys', () => {
    const item = {
      type: 'PASS_NOTICE',
      title: '',
      body: '',
      titleKey: 'singleStagePassTitle',
      bodyKey: 'singleStagePassBody',
    }
    const titles = (['ko', 'en', 'mn'] as const).map((locale) => notificationCopy(item, (key) => translate(locale, key)).title)
    expect(titles[0]).toBe(ko.notifications.singleStagePassTitle)
    expect(titles[1]).toBe(en.notifications.singleStagePassTitle)
    expect(titles[2]).toBe(mn.notifications.singleStagePassTitle)
    expect(new Set(titles).size).toBe(3)
  })

  it('keeps a round notice that already stored a title', () => {
    const copy = notificationCopy(
      { type: 'PASS_NOTICE', title: '라운드 합격 안내', body: '다음 라운드', titleKey: '', bodyKey: '' },
      (key) => translate('en', key),
    )
    expect(copy.title).toBe('라운드 합격 안내')
    expect(copy.body).toBe('다음 라운드')
  })
})
