'use client'

import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'

export default function ApplicantEmptyListState() {
  return (
    <div className={CARD_BASE}>
      <p className={`${TEXT_SUB} text-center`}>표시할 지원자가 없습니다.</p>
    </div>
  )
}
