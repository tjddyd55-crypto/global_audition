'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Audition } from '@/types'
import { AuditionCategory, AuditionStatus } from '@/types'

interface AuditionCardProps {
  audition: Audition
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  const getCategoryLabel = (category: AuditionCategory) => {
    const labels: Record<AuditionCategory, string> = {
      [AuditionCategory.SINGER]: '가수',
      [AuditionCategory.DANCER]: '댄서',
      [AuditionCategory.ACTOR]: '연기',
      [AuditionCategory.MODEL]: '모델',
      [AuditionCategory.INSTRUMENT]: '악기',
    }
    return labels[category] || category
  }

  const getStatusLabel = (status: AuditionStatus) => {
    const labels: Record<AuditionStatus, string> = {
      [AuditionStatus.ONGOING]: '진행중',
      [AuditionStatus.UNDER_SCREENING]: '심사중',
      [AuditionStatus.FINISHED]: '종료',
      [AuditionStatus.WAITING_OPENING]: '오픈 대기',
      [AuditionStatus.WRITING]: '작성중',
    }
    return labels[status] || status
  }

  return (
    <Link
      href={`/auditions/${audition.id}`}
      className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {audition.bannerUrl && (
        <div className="w-full h-48 relative">
          <img
            src={audition.bannerUrl}
            alt={audition.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {audition.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
            {getCategoryLabel(audition.category)}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
            {getStatusLabel(audition.status)}
          </span>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>
            {format(new Date(audition.startDate), 'yyyy.MM.dd', { locale: ko })} ~{' '}
            {format(new Date(audition.endDate), 'yyyy.MM.dd', { locale: ko })}
          </p>
        </div>
        
        {audition.businessName && (
          <p className="text-sm text-gray-500 mt-2">{audition.businessName}</p>
        )}
      </div>
    </Link>
  )
}
