export type PointActivity = 'DAILY_CHECK_IN' | 'MONTHLY_CHECK_IN' | 'LIKE_RECEIVED' | 'LIKE_GIVEN' | 'COMMENT' | 'REFERRAL' | 'VIDEO' | 'PUBLIC_VOTE' | 'PROFILE'

export type PointQuote = {
  creditBalance: number
  creditCost: number
  pointBalance: number
  pointCost: number
  pointAllowed: boolean
}

export type PointTotals = { earnedToday: number; earnedMonth: number; earnedTotal: number; spentTotal: number }

export type PointDashboard = {
  enabled: boolean
  quote: PointQuote
  totals: PointTotals
  today: string
  attendance: string[]
  activities: { activity: PointActivity; goal: number; award: number; progress: number; consecutive: boolean; profileFields: string[] }[]
  referralEligible: boolean
}

export type PointEntry = {
  id: string
  userId: string
  amount: number
  balanceAfter: number
  kind: 'EARN' | 'AUDITION_APPLY' | 'REFUND' | 'ADMIN_GRANT' | 'ADMIN_DEDUCT' | 'REVOKE'
  activity: PointActivity | null
  reason: string
  actorId: string | null
  referenceId: string | null
  createdAt: string
}

export type PointPayment = 'CREDIT' | 'POINT'

export function parseInviteCode(value?: string | string[] | null): string | undefined {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) ? value.toLowerCase() : undefined
}

export const pointActivityLabels = {
  DAILY_CHECK_IN: 'daily', MONTHLY_CHECK_IN: 'monthly', LIKE_RECEIVED: 'liked', LIKE_GIVEN: 'likes',
  COMMENT: 'comments', REFERRAL: 'referrals', VIDEO: 'videos', PUBLIC_VOTE: 'voting', PROFILE: 'profile',
} as const satisfies Record<PointActivity, string>

export const pointEntryLabels = {
  EARN: 'earned', AUDITION_APPLY: 'applied', REFUND: 'refunded',
  ADMIN_GRANT: 'granted', ADMIN_DEDUCT: 'deducted', REVOKE: 'revoked',
} as const satisfies Record<PointEntry['kind'], string>
