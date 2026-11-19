import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import km from '../../../../messages/km.json'
import uz from '../../../../messages/uz.json'
import {
  COMPENSATION_TYPES,
  DECLINE_REASONS,
  OFFER_STATUSES,
  PROJECT_TYPES,
  REPORT_REASONS,
  daysLeft,
  deadlineBounds,
  draftBody,
  draftProblems,
  emptyDraft,
  isOpenOffer,
  parseOffer,
} from '../model'
import { USER_NOTIFICATION_KEYS, notificationCopy, notificationLink } from '../../studio/notificationCopy'

const catalogs = { ko, en, mn, km, uz } as const

describe('casting model', () => {
  it('parses offers defensively and never invents contact', () => {
    const o = parseOffer({ id: 'x', status: 'SENT', title: 'T', history: [{ toStatus: 'SENT', actorKind: 'AGENCY' }] })
    expect(o.contact).toBeNull()
    expect(o.contactShared).toBe(false)
    expect(o.history).toHaveLength(1)
    expect(parseOffer(null).id).toBe('')
  })

  it('treats only unexpired SENT/READ as open', () => {
    const now = Date.parse('2026-11-19T00:00:00Z')
    expect(isOpenOffer({ status: 'SENT', expiresAt: '2026-11-20T00:00:00Z' }, now)).toBe(true)
    expect(isOpenOffer({ status: 'READ', expiresAt: '2026-11-18T00:00:00Z' }, now)).toBe(false)
    expect(isOpenOffer({ status: 'ACCEPTED', expiresAt: '2026-12-20T00:00:00Z' }, now)).toBe(false)
    expect(daysLeft('2026-11-21T00:00:00Z', now)).toBe(2)
    expect(daysLeft('2026-11-01T00:00:00Z', now)).toBe(0)
  })

  it('validates drafts and trims the request body', () => {
    const d = emptyDraft('t1', 'ko')
    expect(draftProblems(d)).toEqual(['OFFER_TITLE_REQUIRED', 'OFFER_MESSAGE_REQUIRED'])
    const body = draftBody({ ...d, title: '  제목 ', message: ' 안녕 ', workLocation: '  ' })
    expect(body.title).toBe('제목')
    expect(body.workLocation).toBeNull()
    const b = deadlineBounds(new Date('2026-11-19T10:00:00Z'))
    expect(b).toEqual({ min: '2026-11-20', max: '2026-12-19' })
  })

  it('has every casting label in all five locales', () => {
    for (const [loc, cat] of Object.entries(catalogs)) {
      const c = cat.casting as Record<string, Record<string, string>>
      for (const s of OFFER_STATUSES) expect([loc, c.status[s]]).toEqual([loc, expect.any(String)])
      for (const s of PROJECT_TYPES) expect(c.projectType[s]).toBeTruthy()
      for (const s of COMPENSATION_TYPES) expect(c.compensationType[s]).toBeTruthy()
      for (const s of DECLINE_REASONS) expect(c.declineReason[s]).toBeTruthy()
      for (const s of REPORT_REASONS) expect(c.reportReason[s]).toBeTruthy()
      const n = cat.notifications as Record<string, string>
      USER_NOTIFICATION_KEYS.forEach((k) => expect([loc, k, Boolean(n[k])]).toEqual([loc, k, true]))
    }
  })
})

describe('user notifications', () => {
  const tr = (key: string, params?: Record<string, string>) =>
    (ko.notifications as Record<string, string>)[key].replace(/\{(\w+)\}/g, (_, k) => params?.[k] ?? '')

  it('renders casting notifications with params', () => {
    const copy = notificationCopy(
      { type: 'CASTING_OFFER_NEW', titleKey: 'castingOfferNewTitle', bodyKey: 'castingOfferNewBody', params: { agency: 'QA 기획사', title: '보컬' } },
      tr,
    )
    expect(copy.title).toBe('새 캐스팅 제안')
    expect(copy.body).toContain('QA 기획사')
    expect(copy.body).toContain('보컬')
  })

  it('only allows in-app links', () => {
    expect(notificationLink({ link: '/my/studio/casting/abc-1' })).toBe('/my/studio/casting/abc-1')
    expect(notificationLink({ link: 'https://evil.example' })).toBeNull()
    expect(notificationLink({ link: '//evil.example' })).toBeNull()
    expect(notificationLink({ link: '/x?y=<script>' })).toBeNull()
  })
})
