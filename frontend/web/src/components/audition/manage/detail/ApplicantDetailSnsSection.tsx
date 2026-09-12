'use client'

import { useTranslations } from 'next-intl'
import type { ApplicationAgencyDetail } from '@/shared/api/auditions'
import { snsPlatformLabel } from './applicantDetailLabels'

type ApplicantDetailSnsSectionProps = {
  snsLinks: ApplicationAgencyDetail['snsLinks']
}

export default function ApplicantDetailSnsSection({ snsLinks }: ApplicantDetailSnsSectionProps) {
  const t = useTranslations('apply')
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{t('sns')}</h3>
      {snsLinks.length === 0 ? (
        <p className="text-sm text-gray-500">{t('snsEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {snsLinks.map((item, index) => (
            <li key={`${item.platform}-${index}`} className="text-sm text-gray-800">
              <span className="font-medium text-violet-700">
                {snsPlatformLabel(item.platform, t('snsOther'))}
              </span>
              <span className="ml-2 break-all text-gray-600">{item.url}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
