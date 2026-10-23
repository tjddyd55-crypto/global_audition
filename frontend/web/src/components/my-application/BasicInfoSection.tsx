'use client'

import { useTranslations } from 'next-intl'
import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'
import { knownNationalityCode } from '@/shared/channel/nationalityDisplay'

function formatBirthDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso.trim()
  return `${m[1]}.${m[2]}.${m[3]}`
}

export type BasicInfoSectionProps = {
  name: string | null | undefined
  birthDate: string | null | undefined
  age: number | null | undefined
  nationality: string | null | undefined
}

export function BasicInfoSection({ name, birthDate, age, nationality }: BasicInfoSectionProps) {
  const tApply = useTranslations('apply')
  const tApp = useTranslations('application')
  const tNat = useTranslations('nationality')
  const code = knownNationalityCode(nationality)
  const nat = code ? tNat(code) : nationality?.trim() || '—'

  return (
    <section className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-4`}>{tApply('sectionBasic')}</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className={TEXT_SUB}>{tApply('name')}</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{name?.trim() || '—'}</dd>
        </div>
        <div>
          <dt className={TEXT_SUB}>{tApply('birthDate')}</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{formatBirthDate(birthDate ?? null)}</dd>
        </div>
        <div>
          <dt className={TEXT_SUB}>{tApply('age')}</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">
            {age != null && age >= 0 ? tApp('ageYears', { age }) : '—'}
          </dd>
        </div>
        <div>
          <dt className={TEXT_SUB}>{tApply('nationality')}</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{nat}</dd>
        </div>
      </dl>
    </section>
  )
}
