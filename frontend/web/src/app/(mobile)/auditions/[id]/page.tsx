'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

export default function AuditionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id],
    queryFn: () => auditionApi.getAudition(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">오디션을 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {audition.bannerUrl && (
        <div className="w-full h-64 md:h-96 relative">
          <img
            src={audition.bannerUrl}
            alt={audition.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{audition.title}</h1>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
            {audition.category}
          </span>
          <span className="ml-2 text-gray-600">{audition.status}</span>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">모집 기간</h2>
          <p className="text-sm text-gray-600">
            {format(new Date(audition.startDate), 'yyyy년 MM월 dd일', {
              locale: ko,
            })}{' '}
            ~{' '}
            {format(new Date(audition.endDate), 'yyyy년 MM월 dd일', {
              locale: ko,
            })}
          </p>
        </div>

        {audition.description && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">상세 설명</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {audition.description}
            </p>
          </div>
        )}

        {audition.requirements && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">지원 자격</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {audition.requirements}
            </p>
          </div>
        )}

        <div className="mt-8">
          <Link
            href={`/auditions/${id}/apply`}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            지원하기
          </Link>
        </div>
      </div>
    </div>
  )
}
