'use client'

import { useTranslations } from 'next-intl'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'
import { formatNationalityLabel, knownNationalityCode } from '@/shared/channel/nationalityDisplay'

/** 국적 · 거주국 · 주 분야 한 줄. 값이 없는 항목은 생략(서버가 비공개 항목을 null 로 내려준다). */
export function ChannelMetaLine({
  nationality,
  residence,
  mainField,
  className,
}: {
  nationality?: string | null
  residence?: string | null
  mainField?: string | null
  className?: string
}) {
  const tNat = useTranslations('nationality')
  const tField = useTranslations('recruitField')
  const t = useTranslations('channel')
  const nat = knownNationalityCode(nationality)
  const res = knownNationalityCode(residence)
  const parts: string[] = []
  if (nat) parts.push(formatNationalityLabel(nat, tNat(nat)))
  if (res && res !== nat) parts.push(t('residenceShort', { country: tNat(res) }))
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 ${className ?? ''}`}>
      {parts.length ? <span className="truncate">{parts.join(' · ')}</span> : null}
      {mainField ? (
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
          {recruitFieldLabel(mainField, (k) => tField(k))}
        </span>
      ) : null}
    </div>
  )
}
