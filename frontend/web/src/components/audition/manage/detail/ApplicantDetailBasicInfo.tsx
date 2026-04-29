'use client'

import type { ApplicationAgencyDetail } from '@/shared/api/auditions'
import { APPLICANT_NATIONALITY_LABEL } from './applicantDetailLabels'

type ApplicantDetailBasicInfoProps = {
  detail: ApplicationAgencyDetail
  birthLabel: string
}

export default function ApplicantDetailBasicInfo({ detail, birthLabel }: ApplicantDetailBasicInfoProps) {
  const nationalityLabel = detail.nationality
    ? APPLICANT_NATIONALITY_LABEL[detail.nationality] ?? detail.nationality
    : '—'

  return (
    <section className="space-y-2 text-sm">
      <h3 className="text-sm font-semibold text-gray-900">기본 정보</h3>
      <p>
        <span className="text-gray-500">이름 </span>
        <span className="font-medium text-gray-900">{detail.name}</span>
      </p>
      <p>
        <span className="text-gray-500">나이 </span>
        <span className="font-medium text-gray-900">{detail.age != null ? `${detail.age}세` : '—'}</span>
      </p>
      <p>
        <span className="text-gray-500">생년월일 </span>
        <span className="font-medium text-gray-900">{birthLabel}</span>
      </p>
      <p>
        <span className="text-gray-500">국적 </span>
        <span className="font-medium text-gray-900">{nationalityLabel}</span>
      </p>
      <p>
        <span className="text-gray-500">지원 차수 </span>
        <span className="font-semibold text-violet-800">{detail.round}차</span>
      </p>
    </section>
  )
}
