'use client'

import Link from 'next/link'
import { PREV_ROUND_APPLY_BLOCKED_MSG, type AuditionDto } from '@/shared/types/audition'

type MobileAuditionApplyBarProps = {
  audition: AuditionDto
  auditionId: string
  alreadyApplied: boolean
  applyBlocked: boolean
}

export default function MobileAuditionApplyBar({
  audition,
  auditionId,
  alreadyApplied,
  applyBlocked,
}: MobileAuditionApplyBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {alreadyApplied ? (
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
          title="이 오디션에 이미 지원하셨습니다."
        >
          이미 지원함
        </button>
      ) : applyBlocked ? (
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
          title={audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
        >
          지금 지원하기
        </button>
      ) : (
        <Link
          href={`/auditions/${auditionId}/apply`}
          className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-lg font-semibold text-white no-underline"
        >
          지금 지원하기
        </Link>
      )}
    </div>
  )
}
