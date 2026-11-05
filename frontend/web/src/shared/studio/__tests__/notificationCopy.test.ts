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
  it('names a single-stage result in ko, en, and mn', () => {
    const item = {
      type: 'PASS_NOTICE',
      title: '',
      body: '',
      titleKey: 'singleStagePassTitle',
      bodyKey: 'singleStagePassBody',
    }
    const copies = (['ko', 'en', 'mn'] as const).map((locale) => notificationCopy(item, (key) => translate(locale, key)))
    expect(copies.map((copy) => copy.title)).toEqual([
      ko.notifications.singleStageResultTitle,
      en.notifications.singleStageResultTitle,
      mn.notifications.singleStageResultTitle,
    ])
    expect(copies.map((copy) => copy.body)).toEqual([
      ko.notifications.singleStagePassBody,
      en.notifications.singleStagePassBody,
      mn.notifications.singleStagePassBody,
    ])
    expect(new Set(copies.map((copy) => copy.title)).size).toBe(3)
  })

  it('names a multi-stage notice from the notification type', () => {
    const pass = notificationCopy(
      { type: 'PASS_NOTICE', title: '라운드 합격 안내', body: '다음 라운드', titleKey: '', bodyKey: '', roundId: 'round-1' },
      (key) => translate('ko', key),
    )
    const fail = notificationCopy(
      { type: 'FAIL_NOTICE', title: '라운드 결과 안내', body: '진행이 어렵습니다', roundId: 'round-1' },
      (key) => translate('en', key),
    )
    expect(pass.title).toBe(ko.notifications.multiStageResultTitle)
    expect(pass.body).toBe(ko.notifications.multiStagePassBody)
    expect(fail.title).toBe(en.notifications.multiStageResultTitle)
    expect(fail.body).toBe(en.notifications.multiStageFailBody)
  })
})
