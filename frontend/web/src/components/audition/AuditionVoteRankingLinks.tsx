'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'

type Props = {
  auditionId: string
  /** 공고 투표 설정상 현재 회차 투표 사용 여부. false 면 아무것도 그리지 않는다. */
  votingEnabled: boolean
}

/** 모바일웹 상세: 투표를 켠 회차에서 누구나 투표·랭킹으로 갈 수 있는 링크. */
export function AuditionVoteRankingLinks({ auditionId, votingEnabled }: Props) {
  const t = useTranslations('auditionDetail')
  if (!votingEnabled) return null
  const cls =
    'flex-1 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-violet-700 no-underline'
  return (
    <div className="flex gap-2 px-4 pt-3" data-testid="vote-ranking-links">
      <Link href={`/auditions/${auditionId}/vote`} className={cls}>
        {t('vote')}
      </Link>
      <Link href={`/auditions/${auditionId}/ranking`} className={cls}>
        {t('viewRanking')}
      </Link>
    </div>
  )
}
