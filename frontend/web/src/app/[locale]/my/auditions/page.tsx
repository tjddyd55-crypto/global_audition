'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '../../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auditionApi, type AuditionResponse } from '../../../../lib/api/auditions'
import { authApi } from '../../../../lib/api/auth'
import { DEFAULT_IMAGES } from '../../../../lib/constants/fallbacks'
import { auditionListImageUrl, normalizeAuditionImages } from '../../../../lib/types/audition'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

type StatusStyleFn = (status: string) => string
type StatusTextFn = (status: string) => string

function MyAuditionManageCard({
  audition,
  getStatusBadgeColor,
  getStatusText,
  onDelete,
  deletePending,
}: {
  audition: AuditionResponse
  getStatusBadgeColor: StatusStyleFn
  getStatusText: StatusTextFn
  onDelete: (id: string) => void
  deletePending: boolean
}) {
  const im = normalizeAuditionImages(audition.images)
  const thumb = (im.thumb ?? '').trim()
  const medium = (im.medium ?? '').trim()
  const original = (im.original ?? '').trim()
  const listPrimary = auditionListImageUrl(im)
  const initialSrc = listPrimary || DEFAULT_IMAGES.videoThumbnail
  const [imgSrc, setImgSrc] = useState(initialSrc)

  useEffect(() => {
    setImgSrc(listPrimary || DEFAULT_IMAGES.videoThumbnail)
  }, [listPrimary])

  const onCoverError = useCallback(() => {
    setImgSrc((cur) => {
      if (cur === thumb && medium) return medium
      if ((cur === thumb || cur === medium) && original) return original
      return DEFAULT_IMAGES.videoThumbnail
    })
  }, [thumb, medium, original])

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl md:flex-row md:items-start md:gap-6">
      <div className="w-full shrink-0 md:w-44">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-gray-100 md:aspect-auto md:h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
            onError={onCoverError}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
          <h3
            className="min-w-0 flex-1 text-xl font-semibold break-keep break-words text-gray-900"
            style={{ writingMode: 'horizontal-tb' }}
          >
            {audition.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeColor(audition.status)}`}
          >
            {getStatusText(audition.status)}
          </span>
        </div>

        {audition.description ? (
          <p className="line-clamp-2 text-gray-700">{audition.description}</p>
        ) : null}

        <div className="text-sm text-gray-500">
          <span>등록: {new Date(audition.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex flex-nowrap gap-2 overflow-x-auto pt-1 [scrollbar-width:thin]">
          <Link
            href={`/auditions/${audition.id}`}
            className="shrink-0 whitespace-nowrap rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            상세보기
          </Link>
          <Link
            href={`/auditions/${audition.id}/applications`}
            className="shrink-0 whitespace-nowrap rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            지원자 관리
          </Link>
          <button
            type="button"
            onClick={() => onDelete(audition.id)}
            className="shrink-0 whitespace-nowrap rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            disabled={deletePending}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyAuditionsPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/login')
      setIsCheckingAuth(false)
      return
    }
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    if (role === 'AGENCY' || role === 'ADMIN') setUserType('BUSINESS')
    else router.push('/')
    setIsCheckingAuth(false)
  }, [router])

  const { data: auditions, isLoading } = useQuery({
    queryKey: ['myAuditions', page],
    queryFn: () => auditionApi.getMyAuditions({ page, size: 20 }),
    enabled: userType === 'BUSINESS',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditionApi.deleteAudition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAuditions'] })
    },
  })

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '삭제는 현재 지원되지 않습니다.')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      case 'DRAFT':
        return 'bg-purple-100 text-purple-800'
      case 'ONGOING':
        return 'bg-green-100 text-green-800'
      case 'UNDER_SCREENING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FINISHED':
        return 'bg-gray-100 text-gray-800'
      case 'WAITING_OPENING':
        return 'bg-blue-100 text-blue-800'
      case 'WRITING':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN':
        return '모집 중'
      case 'CLOSED':
        return '종료'
      case 'DRAFT':
        return '작성 중'
      case 'ONGOING':
        return '진행 중'
      case 'UNDER_SCREENING':
        return '심사 중'
      case 'FINISHED':
        return '종료'
      case 'WAITING_OPENING':
        return '오픈 대기'
      case 'WRITING':
        return '작성 중'
      default:
        return status
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'BUSINESS') {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">내 오디션 관리</h1>
          <Link
            href="/dashboard/auditions/create"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + 오디션 등록
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">{t('loading')}</div>
          </div>
        ) : auditions && auditions.content.length > 0 ? (
          <div className="space-y-4">
            {auditions.content.map((audition: AuditionResponse) => (
              <MyAuditionManageCard
                key={audition.id}
                audition={audition}
                getStatusBadgeColor={getStatusBadgeColor}
                getStatusText={getStatusText}
                onDelete={handleDelete}
                deletePending={deleteMutation.isPending}
              />
            ))}

            {/* 페이지네이션 */}
            {auditions.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {page + 1} / {auditions.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(auditions.totalPages - 1, p + 1))}
                  disabled={page >= auditions.totalPages - 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">등록된 오디션이 없습니다</p>
            <Link
              href="/dashboard/auditions/create"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block"
            >
              첫 오디션 등록하기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
