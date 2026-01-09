'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import AuditionCard from './AuditionCard'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

interface AuditionListProps {
  category?: string
  status?: string
}

export default function AuditionList({ category, status }: AuditionListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auditions', category, status],
    queryFn: () => auditionApi.getAuditions({ category, status, page: 0, size: 20 }),
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message="오디션 목록을 불러오는데 실패했습니다." />
  }

  if (!data || data.content.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">등록된 오디션이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.content.map((audition) => (
        <AuditionCard key={audition.id} audition={audition} />
      ))}
    </div>
  )
}
