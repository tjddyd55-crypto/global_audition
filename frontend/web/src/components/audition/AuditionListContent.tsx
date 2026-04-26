'use client'

import type { AuditionDto } from '@/shared/types/audition'
import AuditionCard from './AuditionCard'
import { SkeletonAuditionCard } from '../ui/SkeletonCard'
import EmptyState from '../ui/EmptyState'
import ErrorMessage from '../common/ErrorMessage'

type AuditionListContentProps = {
  auditions?: AuditionDto[]
  isLoading: boolean
  error: unknown
}

export default function AuditionListContent({ auditions, isLoading, error }: AuditionListContentProps) {
  if (isLoading) {
    return (
      <div className="flex w-full flex-col lg:gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonAuditionCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message="오디션 목록을 불러오는데 실패했습니다." />
  }

  if (!auditions || auditions.length === 0) {
    return <EmptyState message="등록된 오디션이 없습니다" />
  }

  return (
    <div className="flex w-full flex-col lg:gap-3">
      {auditions.map((audition: AuditionDto) => (
        <AuditionCard key={audition?.id ?? ''} audition={audition} />
      ))}
    </div>
  )
}
