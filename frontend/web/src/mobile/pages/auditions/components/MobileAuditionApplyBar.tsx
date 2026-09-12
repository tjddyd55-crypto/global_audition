'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { AuditionDto } from '@/shared/types/audition'

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
  const tDetail = useTranslations('auditionDetail')
  const tApply = useTranslations('apply')
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {alreadyApplied ? (
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
          title={tDetail('alreadyAppliedHere')}
        >
          {tDetail('alreadyAppliedShort')}
        </button>
      ) : applyBlocked ? (
        <button
          type="button"
          disabled
          className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
          title={audition.applyBlockedMessage ?? tApply('prevRoundBlocked')}
        >
          {tDetail('applyNow')}
        </button>
      ) : (
        <Link
          href={`/auditions/${auditionId}/apply`}
          className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-lg font-semibold text-white no-underline"
        >
          {tDetail('applyNow')}
        </Link>
      )}
    </div>
  )
}
