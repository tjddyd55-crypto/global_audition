'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { CastingOffer } from '@/shared/casting/model'
import { daysLeft, isOpenOffer } from '@/shared/casting/model'
import { TranslationNotice, translatedText, useContentTranslation } from '@/components/i18n/TranslatedField'

const TONE: Record<string, string> = {
  SENT: 'bg-violet-100 text-violet-800',
  READ: 'bg-sky-100 text-sky-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  DECLINED: 'bg-neutral-200 text-neutral-700',
  EXPIRED: 'bg-amber-100 text-amber-800',
  WITHDRAWN: 'bg-neutral-200 text-neutral-600',
}

export function OfferStatusBadge({ status }: { status: string }) {
  const t = useTranslations('casting')
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[status] ?? TONE.DECLINED}`}>
      {t.has(`status.${status}`) ? t(`status.${status}`) : status}
    </span>
  )
}

export function OfferDeadline({ offer }: { offer: CastingOffer }) {
  const t = useTranslations('casting')
  const locale = useLocale()
  if (!offer.expiresAt) return null
  const left = daysLeft(offer.expiresAt)
  const date = new Date(offer.expiresAt).toLocaleDateString(locale)
  const open = isOpenOffer(offer)
  return (
    <span className={open && left !== null && left <= 2 ? 'font-semibold text-amber-700' : ''}>
      {date}
      {open && left !== null ? ` · ${t('daysLeft', { days: String(left) })}` : ''}
      {!open && offer.status === 'EXPIRED' ? ` · ${t('expired')}` : ''}
    </span>
  )
}

/** 지원자용 제안 본문. 자유 입력은 CASTING_OFFER 번역(비동기 큐)을 쓴다. 연락처는 번역에 보내지 않는다. */
export function OfferFacts({ offer }: { offer: CastingOffer }) {
  const t = useTranslations('casting')
  const tField = useTranslations('recruitField')
  const tCountry = useTranslations('nationality')
  const copy = useContentTranslation('CASTING_OFFER', offer.id || undefined)
  const tr = (raw: string | null, key: string) => (raw ? translatedText(raw, copy.view, key, copy.showOriginal) : '')
  const country = offer.workCountry ? (tCountry.has(offer.workCountry) ? tCountry(offer.workCountry) : offer.workCountry) : ''
  const place = [country, tr(offer.workLocation, 'workLocation')].filter(Boolean).join(' · ')
  const comp = [
    t.has(`compensationType.${offer.compensationType}`) ? t(`compensationType.${offer.compensationType}`) : offer.compensationType,
    tr(offer.compensationNote, 'compensationNote'),
  ]
    .filter(Boolean)
    .join(' · ')
  const rows: [string, string][] = [
    [t('project'), t.has(`projectType.${offer.projectType}`) ? t(`projectType.${offer.projectType}`) : offer.projectType],
    [t('role'), tField.has(offer.roleField) ? tField(offer.roleField) : offer.roleField],
    [t('workPlace'), place],
    [t('schedule'), tr(offer.scheduleText, 'scheduleText')],
    [t('compensation'), comp],
  ]
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 className="break-words text-lg font-semibold text-neutral-900">{tr(offer.title, 'title') || offer.title}</h2>
      <dl className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-3 gap-y-1.5 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-neutral-500">{k}</dt>
              <dd className="min-w-0 break-words text-neutral-900">{v}</dd>
            </div>
          ))}
        <dt className="text-neutral-500">{t('deadline')}</dt>
        <dd className="text-neutral-900">
          <OfferDeadline offer={offer} />
        </dd>
      </dl>
      <div>
        <p className="text-xs font-medium text-neutral-500">{t('message')}</p>
        <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-neutral-50 p-3 text-sm text-neutral-800">
          {tr(offer.message, 'message') || offer.message}
        </p>
        <TranslationNotice view={copy.view} showOriginal={copy.showOriginal} onToggle={copy.setShowOriginal} />
      </div>
    </div>
  )
}
