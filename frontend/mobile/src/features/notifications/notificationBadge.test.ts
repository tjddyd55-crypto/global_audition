import ko from '../../../../web/messages/ko.json'
import en from '../../../../web/messages/en.json'
import { notificationBadge } from './notificationCopy'

const translate = (catalog: { notifications: Record<string, string> }) => (key: string) => catalog.notifications[key]

describe('notification badge', () => {
  it('labels a stored single-stage acceptance without the delivery status', () => {
    const item = {
      type: 'PASS_NOTICE',
      status: 'PENDING',
      titleKey: 'singleStageResultTitle',
      bodyKey: 'singleStagePassBody',
      roundId: null,
    }
    expect(notificationBadge(item, translate(en))).toBe('Acceptance notice')
    expect(notificationBadge(item, translate(ko))).toBe('합격 안내')
    expect(notificationBadge(item, translate(en))).not.toContain('Pending')
    expect(
      notificationBadge(
        {
          type: 'FAIL_NOTICE',
          status: 'PENDING',
          titleKey: 'singleStageResultTitle',
          bodyKey: 'singleStageFailBody',
          roundId: null,
        },
        translate(en),
      ),
    ).toBe('Result notice')
  })

  it('keeps a round notice on the delivery-status badge', () => {
    const badge = notificationBadge(
      { type: 'PASS_NOTICE', status: 'PENDING', titleKey: 'multiStageResultTitle', roundId: 'round-1' },
      translate(en),
    )
    expect(badge).toBe('Round pass notice · Pending')
  })
})
