import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import { notificationBadge, notificationCodeLabel, notificationCopy } from '../notificationCopy'

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

  it('maps PASS_NOTICE and PENDING to catalog labels in ko, en, and mn', () => {
    for (const locale of ['ko', 'en', 'mn'] as const) {
      const type = notificationCodeLabel('PASS_NOTICE', (key) => translate(locale, key))
      const status = notificationCodeLabel('PENDING', (key) => translate(locale, key))
      expect(type).toBe(catalogs[locale].notifications.PASS_NOTICE)
      expect(status).toBe(catalogs[locale].notifications.PENDING)
      expect(`${type} · ${status}`).not.toBe('PASS_NOTICE · PENDING')
    }
    expect(notificationCodeLabel('UNKNOWN_CODE', () => '')).toBe('UNKNOWN_CODE')
  })

  it('shows a single accepted result as the decision, not the round type or delivery pending', () => {
    const item = {
      type: 'PASS_NOTICE',
      status: 'PENDING',
      titleKey: 'singleStageResultTitle',
      bodyKey: 'singleStagePassBody',
      roundId: null,
    }
    for (const locale of ['ko', 'en', 'mn'] as const) {
      const badge = notificationBadge(item, (key) => translate(locale, key))
      expect(badge).toBe(catalogs[locale].notifications.singleStagePassTitle)
      expect(badge).not.toContain(catalogs[locale].notifications.PASS_NOTICE)
      expect(badge).not.toContain(catalogs[locale].notifications.PENDING)
    }
  })

  it('keeps a round notice badge as type and delivery status', () => {
    const badge = notificationBadge(
      { type: 'PASS_NOTICE', status: 'PENDING', titleKey: 'multiStageResultTitle', roundId: 'round-1' },
      (key) => translate('en', key),
    )
    expect(badge).toBe(`${en.notifications.PASS_NOTICE} · ${en.notifications.PENDING}`)
  })
})
