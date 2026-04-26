'use client'

import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

type MyApplicantsEmptyStateProps = {
  hasAuditions: boolean
}

export default function MyApplicantsEmptyState({ hasAuditions }: MyApplicantsEmptyStateProps) {
  return (
    <div className={`${PAGE_CONTAINER} py-10`}>
      <h1 className="text-xl font-semibold text-gray-900">지원자 관리</h1>
      <p className={`${TEXT_SUB} mt-2`}>
        {!hasAuditions
          ? '등록된 오디션이 없습니다. 오디션 관리에서 공고를 만든 뒤 이용해 주세요.'
          : '오디션을 선택해 주세요.'}
      </p>
    </div>
  )
}
