'use client'

import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@/i18n.config'
import { meApplicationRoundsApi } from '@/shared/api/meApplicationRounds'
import { messageForReasonCode } from '@/shared/audition/reasonMessages'

type Props = {
  applicationId: string
  /** 제출 후 오디션 상세 쿼리 무효화용 (선택) */
  auditionId?: string | null
  /** null·빈 값이면 CTA·API 호출 없음 */
  roundId: string | null
  /** 예: "2차 지원하기" */
  label: string
  className?: string
  style?: CSSProperties
}

function buildSubmitHref(applicationId: string, roundId: string, auditionId?: string | null) {
  const base = `/my/applications/${encodeURIComponent(applicationId)}/rounds/${encodeURIComponent(roundId)}/submit`
  if (auditionId != null && auditionId.length > 0) {
    return `${base}?auditionId=${encodeURIComponent(auditionId)}`
  }
  return base
}

/**
 * eligibility 조회 후 canSubmit 이면 제출 링크, 아니면 사유 안내.
 * roundId 가 없으면 렌더링하지 않는다(상위에서 안내).
 */
export function MultiRoundSubmitCta({
  applicationId,
  auditionId,
  roundId,
  label,
  className,
  style,
}: Props) {
  const roundIdTrimmed = roundId?.trim() ?? ''
  const q = useQuery({
    queryKey: ['me-round-eligibility', applicationId, roundIdTrimmed],
    queryFn: () => meApplicationRoundsApi.getEligibility(applicationId, roundIdTrimmed),
    enabled: applicationId.length > 0 && roundIdTrimmed.length > 0,
    staleTime: 30_000,
  })

  if (!roundIdTrimmed) {
    return null
  }

  if (q.isPending) {
    return <p className="text-sm text-gray-500">제출 가능 여부 확인 중…</p>
  }

  if (q.isError) {
    return <p className="text-sm text-red-600">제출 조건을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
  }

  if (!q.data.canSubmit) {
    const reasonKey = q.data.reason?.trim() || null
    const msg = reasonKey ? messageForReasonCode(reasonKey) : '현재는 제출할 수 없습니다.'
    return <p className="text-sm text-gray-500">{msg}</p>
  }

  return (
    <Link href={buildSubmitHref(applicationId, roundIdTrimmed, auditionId)} className={className} style={style}>
      {label}
    </Link>
  )
}
