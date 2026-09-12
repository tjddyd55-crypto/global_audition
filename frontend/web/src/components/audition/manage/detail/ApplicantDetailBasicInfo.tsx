'use client'

import { useTranslations } from 'next-intl'
import type { ApplicationAgencyDetail } from '@/shared/api/auditions'
import { nationalityCatalogKey } from './applicantDetailLabels'

type ApplicantDetailBasicInfoProps = {
  detail: ApplicationAgencyDetail
  birthLabel: string
}

export default function ApplicantDetailBasicInfo({ detail, birthLabel }: ApplicantDetailBasicInfoProps) {
  const tApply = useTranslations('apply')
  const tNat = useTranslations('nationality')
  const nationalityLabel = detail.nationality
    ? tNat(nationalityCatalogKey(detail.nationality))
    : '—'

  return (
    <section className="space-y-2 text-sm">
      <h3 className="text-sm font-semibold text-gray-900">{tApply('sectionBasic')}</h3>
      <p>
        <span className="text-gray-500">{tApply('name')} </span>
        <span className="font-medium text-gray-900">{detail.name}</span>
      </p>
      <p>
        <span className="text-gray-500">{tApply('age')} </span>
        <span className="font-medium text-gray-900">
          {detail.age != null ? tApply('ageAuto', { age: detail.age }) : '—'}
        </span>
      </p>
      <p>
        <span className="text-gray-500">{tApply('birthDate')} </span>
        <span className="font-medium text-gray-900">{birthLabel}</span>
      </p>
      <p>
        <span className="text-gray-500">{tApply('nationality')} </span>
        <span className="font-medium text-gray-900">{nationalityLabel}</span>
      </p>
      <p>
        <span className="text-gray-500">{tApply('applyRound')} </span>
        <span className="font-semibold text-violet-800">{tApply('roundN', { n: detail.round })}</span>
      </p>
    </section>
  )
}
