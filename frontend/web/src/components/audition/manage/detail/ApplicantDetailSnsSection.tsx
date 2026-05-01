'use client'

import type { ApplicationAgencyDetail } from '@/shared/api/auditions'
import { APPLICANT_SNS_PLATFORM_LABEL } from './applicantDetailLabels'

type ApplicantDetailSnsSectionProps = {
  snsLinks: ApplicationAgencyDetail['snsLinks']
}

export default function ApplicantDetailSnsSection({ snsLinks }: ApplicantDetailSnsSectionProps) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">SNS</h3>
      {snsLinks.length === 0 ? (
        <p className="text-sm text-gray-500">등록된 SNS가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {snsLinks.map((item, index) => (
            <li key={`${item.platform}-${index}`} className="text-sm text-gray-800">
              <span className="font-medium text-violet-700">
                {APPLICANT_SNS_PLATFORM_LABEL[item.platform] ?? item.platform}
              </span>
              <span className="ml-2 break-all text-gray-600">{item.url}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
