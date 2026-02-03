'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '../../../../lib/api/auditions'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useTranslations } from 'next-intl'
import { VideoType } from '../../../../types'
import { useState } from 'react'

export default function AuditionDetailPage() {
  const params = useParams()
  const t = useTranslations('common')
  const id = Number(params.id)
  const [imageError, setImageError] = useState(false)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id],
    queryFn: () => auditionApi.getAudition(id),
    enabled: !!id,
  })

  // YouTube URL에서 비디오 ID 추출
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // YouTube 임베드 URL 생성
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{t('error')}</div>
      </div>
    )
  }

  const youtubeEmbedUrl = audition.videoUrl && audition.videoType === VideoType.YOUTUBE
    ? getYouTubeEmbedUrl(audition.videoUrl)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 배너 이미지 */}
      {audition.bannerUrl && !imageError && (
        <div className="w-full h-64 md:h-96 relative bg-gray-200">
          <img
            src={audition.bannerUrl}
            alt={audition.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{audition.title}</h1>
          
          {audition.titleEn && (
            <p className="text-lg text-gray-600 mb-4">{audition.titleEn}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block px-4 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              {audition.category}
            </span>
            <span className="inline-block px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {audition.status === 'ONGOING' ? '진행 중' : 
               audition.status === 'WAITING_OPENING' ? '공개 대기' :
               audition.status === 'FINISHED' ? '마감' : audition.status}
            </span>
            {audition.businessName && (
              <span className="inline-block px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {audition.businessName}
              </span>
            )}
          </div>

          {/* 모집 기간 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2 text-gray-700">모집 기간</h2>
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
        </div>

        {/* 영상 섹션 */}
        {youtubeEmbedUrl && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">오디션 영상</h2>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={youtubeEmbedUrl}
                title="오디션 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* 포스터 이미지 (배너가 없거나 에러인 경우) */}
        {audition.posterUrl && (imageError || !audition.bannerUrl) && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">포스터</h2>
            <div className="w-full max-w-2xl mx-auto">
              <img
                src={audition.posterUrl}
                alt={`${audition.title} 포스터`}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* 상세 설명 */}
        {audition.description && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">상세 설명</h2>
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {audition.description}
            </div>
          </div>
        )}

        {/* 지원 자격 */}
        {audition.requirements && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">지원 자격</h2>
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {audition.requirements}
            </div>
          </div>
        )}

        {/* 사진 크기 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📸 지원 시 사진 업로드 안내</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>권장 크기:</strong> 최소 1920 x 1080px (Full HD)</p>
            <p><strong>최대 크기:</strong> 10MB 이하</p>
            <p><strong>지원 형식:</strong> JPG, PNG, WEBP</p>
            <p><strong>비율:</strong> 16:9 또는 4:3 권장</p>
            <p className="text-xs text-blue-600 mt-3">
              💡 고해상도 사진을 업로드하시면 더 나은 평가를 받을 수 있습니다.
            </p>
          </div>
        </div>

        {/* 지원하기 버튼 */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
          <Link
            href={`/auditions/${id}/apply`}
            className="inline-block px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
          >
            지원하기
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            지원 전 모든 내용을 확인해주세요
          </p>
        </div>
      </div>
    </div>
  )
}
