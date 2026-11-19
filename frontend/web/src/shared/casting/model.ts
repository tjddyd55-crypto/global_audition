/**
 * 캐스팅 제안 공용 모델(웹·네이티브 공유). '@/' import 없이 유지한다.
 * 수락은 '관심 있음' 표시일 뿐 계약·지원·결제·크레딧 차감이 없다.
 */

export const OFFER_STATUSES = ['SENT', 'READ', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'] as const
export type OfferStatus = (typeof OFFER_STATUSES)[number]
export const OPEN_STATUSES: readonly string[] = ['SENT', 'READ']

export const PROJECT_TYPES = ['AUDITION_INVITE', 'TRAINEE', 'PROJECT', 'CONTENT_COLLAB', 'MODEL_SHOOT', 'OTHER'] as const
export const COMPENSATION_TYPES = ['PAID', 'UNPAID', 'NEGOTIABLE', 'TBD'] as const
export const DECLINE_REASONS = ['NOT_INTERESTED', 'SCHEDULE', 'FIELD_MISMATCH', 'LOCATION', 'OTHER'] as const
export const REPORT_REASONS = ['SPAM', 'FRAUD', 'EXTERNAL_PAYMENT', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER'] as const
export const WORK_COUNTRIES = ['KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER'] as const
export const OFFER_ROLE_FIELDS = ['VOCAL', 'DANCE', 'RAP', 'ACTING', 'MODEL', 'INFLUENCER', 'OTHER'] as const
export const MIN_DEADLINE_DAYS = 1
export const MAX_DEADLINE_DAYS = 30
export const DEFAULT_DEADLINE_DAYS = 14

export type CastingParty = {
  userId: string | null
  name: string | null
  profileImageUrl: string | null
  countryCode: string | null
}

export type CastingEvent = {
  fromStatus: string | null
  toStatus: string
  actorKind: string
  createdAt: string | null
}

export type CastingOffer = {
  id: string
  status: OfferStatus | string
  title: string
  projectType: string
  roleField: string
  message: string
  workCountry: string | null
  workLocation: string | null
  scheduleText: string | null
  compensationType: string
  compensationNote: string | null
  auditionId: string | null
  contactRequested: boolean
  contactShared: boolean
  sourceLocale: string | null
  expiresAt: string | null
  readAt: string | null
  respondedAt: string | null
  responseReason: string | null
  responseNote: string | null
  createdAt: string | null
  agency: CastingParty | null
  talent: CastingParty | null
  contact: { email: string | null; phone: string | null } | null
  history: CastingEvent[]
  agencyBlocked: boolean
}

export type OfferDraft = {
  talentUserId: string
  title: string
  projectType: string
  roleField: string
  message: string
  workCountry: string
  workLocation: string
  scheduleText: string
  compensationType: string
  compensationNote: string
  responseDeadline: string
  contactRequested: boolean
  sourceLocale: string
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)

function party(raw: unknown): CastingParty | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return { userId: str(r.userId), name: str(r.name), profileImageUrl: str(r.profileImageUrl), countryCode: str(r.countryCode) }
}

export function parseOffer(raw: unknown): CastingOffer {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const contact = r.contact && typeof r.contact === 'object' ? (r.contact as Record<string, unknown>) : null
  return {
    id: String(r.id ?? ''),
    status: String(r.status ?? 'SENT'),
    title: String(r.title ?? ''),
    projectType: String(r.projectType ?? 'OTHER'),
    roleField: String(r.roleField ?? 'OTHER'),
    message: String(r.message ?? ''),
    workCountry: str(r.workCountry),
    workLocation: str(r.workLocation),
    scheduleText: str(r.scheduleText),
    compensationType: String(r.compensationType ?? 'TBD'),
    compensationNote: str(r.compensationNote),
    auditionId: str(r.auditionId),
    contactRequested: r.contactRequested === true,
    contactShared: r.contactShared === true,
    sourceLocale: str(r.sourceLocale),
    expiresAt: str(r.expiresAt),
    readAt: str(r.readAt),
    respondedAt: str(r.respondedAt),
    responseReason: str(r.responseReason),
    responseNote: str(r.responseNote),
    createdAt: str(r.createdAt),
    agency: party(r.agency),
    talent: party(r.talent),
    contact: contact ? { email: str(contact.email), phone: str(contact.phone) } : null,
    history: Array.isArray(r.history)
      ? (r.history as Record<string, unknown>[]).map((e) => ({
          fromStatus: str(e.fromStatus),
          toStatus: String(e.toStatus ?? ''),
          actorKind: String(e.actorKind ?? ''),
          createdAt: str(e.createdAt),
        }))
      : [],
    agencyBlocked: r.agencyBlocked === true,
  }
}

export function isOpenOffer(o: Pick<CastingOffer, 'status' | 'expiresAt'>, now: number = Date.now()): boolean {
  if (!OPEN_STATUSES.includes(o.status)) return false
  const exp = o.expiresAt ? Date.parse(o.expiresAt) : NaN
  return Number.isNaN(exp) || exp > now
}

/** 마감까지 남은 일수(올림). 지났으면 0. */
export function daysLeft(expiresAt: string | null, now: number = Date.now()): number | null {
  if (!expiresAt) return null
  const t = Date.parse(expiresAt)
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.ceil((t - now) / 86_400_000))
}

export function defaultDeadline(today: Date = new Date()): string {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + DEFAULT_DEADLINE_DAYS))
  return d.toISOString().slice(0, 10)
}

export function deadlineBounds(today: Date = new Date()): { min: string; max: string } {
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return {
    min: new Date(base + MIN_DEADLINE_DAYS * 86_400_000).toISOString().slice(0, 10),
    max: new Date(base + MAX_DEADLINE_DAYS * 86_400_000).toISOString().slice(0, 10),
  }
}

export function emptyDraft(talentUserId: string, locale: string): OfferDraft {
  return {
    talentUserId,
    title: '',
    projectType: 'AUDITION_INVITE',
    roleField: 'VOCAL',
    message: '',
    workCountry: 'KR',
    workLocation: '',
    scheduleText: '',
    compensationType: 'TBD',
    compensationNote: '',
    responseDeadline: defaultDeadline(),
    contactRequested: false,
    sourceLocale: locale,
  }
}

/** 클라이언트 1차 확인(서버가 최종 판단). 빈 배열이면 보낼 수 있다. */
export function draftProblems(d: OfferDraft): string[] {
  const out: string[] = []
  if (!d.title.trim()) out.push('OFFER_TITLE_REQUIRED')
  if (!d.message.trim()) out.push('OFFER_MESSAGE_REQUIRED')
  if (d.title.length > 120) out.push('OFFER_TITLE_TOO_LONG')
  if (d.message.length > 2000) out.push('OFFER_MESSAGE_TOO_LONG')
  return out
}

export function draftBody(d: OfferDraft): Record<string, unknown> {
  const opt = (s: string) => (s.trim() ? s.trim() : null)
  return {
    talentUserId: d.talentUserId,
    title: d.title.trim(),
    projectType: d.projectType,
    roleField: d.roleField,
    message: d.message.trim(),
    workCountry: opt(d.workCountry),
    workLocation: opt(d.workLocation),
    scheduleText: opt(d.scheduleText),
    compensationType: d.compensationType,
    compensationNote: opt(d.compensationNote),
    responseDeadline: d.responseDeadline || null,
    contactRequested: d.contactRequested,
    sourceLocale: d.sourceLocale,
  }
}
