'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videoApi, VideoContent } from '../../../lib/api/videos'
import { userApi } from '../../../lib/api/user'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  CARD_MEDIA_SHELL,
  INPUT_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { ChannelPublicSettings } from '@/components/channel/ChannelPublicSettings'
import { VideoVisibilitySwitch } from '@/components/channel/VideoVisibilitySwitch'

const videoSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  description: z.string().optional(),
  videoUrl: z.string().url('유효한 YouTube URL을 입력해주세요'),
  category: z.string().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'PRIVATE']),
})

type VideoFormData = z.infer<typeof videoSchema>

export default function ChannelPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      status: 'PRIVATE',
    },
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authApi.getToken()
        if (!token) {
          router.push('/login')
          return
        }

        const user = await userApi.getCurrentUser()
        if (user.role !== 'APPLICANT') {
          router.push('/')
          return
        }

        setUserType('APPLICANT')
      } catch (err: any) {
        console.error('Auth check failed:', err)
        if (err.response?.status === 401) {
          router.push('/login')
        }
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const { data: videos, isLoading } = useQuery({
    queryKey: ['my-channel-videos'],
    queryFn: () => videoApi.getMyChannelVideos(),
    enabled: userType === 'APPLICANT',
  })

  const createMutation = useMutation({
    mutationFn: (data: VideoFormData) =>
      videoApi.createVideo({
        ...data,
        status: data.status as 'PUBLISHED' | 'DRAFT' | 'PRIVATE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-channel-videos'] })
      queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      setShowCreateForm(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoApi.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-channel-videos'] })
      queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VideoFormData }) => videoApi.updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-channel-videos'] })
      queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      setEditingVideo(null)
      setShowCreateForm(false)
      reset()
    },
  })

  const onSubmit = async (data: VideoFormData) => {
    try {
      if (editingVideo) {
        await updateMutation.mutateAsync({ id: editingVideo.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
    } catch (err: any) {
      console.error('Video operation failed:', err)
    }
  }

  const handleEdit = (video: VideoContent) => {
    setEditingVideo(video)
    reset({
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl,
      category: video.category || '',
      status: video.status as 'PUBLISHED' | 'DRAFT' | 'PRIVATE',
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteMutation.mutateAsync(id)
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-semibold text-gray-900">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'APPLICANT') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className={TITLE_PAGE}>내 채널 관리</h1>
          <button
            type="button"
            onClick={() => {
              setEditingVideo(null)
              reset()
              setShowCreateForm(true)
            }}
            className={BTN_PRIMARY}
          >
            + 영상 업로드
          </button>
        </div>

        {showCreateForm && (
          <div className={CARD_BASE}>
            <h2 className={`${TITLE_PAGE} mb-4`}>{editingVideo ? '영상 수정' : '새 영상 추가'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">제목 *</label>
                <input type="text" {...register('title')} className={INPUT_BASE} placeholder="영상 제목" />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">설명</label>
                <textarea {...register('description')} rows={4} className={INPUT_BASE} placeholder="영상 설명" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">YouTube URL *</label>
                <input type="url" {...register('videoUrl')} className={INPUT_BASE} placeholder="https://www.youtube.com/watch?v=..." />
                {errors.videoUrl && <p className="mt-1 text-sm text-red-600">{errors.videoUrl.message}</p>}
                <p className={`${TEXT_SUB} mt-1`}>YouTube 영상 URL을 입력해주세요</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">카테고리</label>
                <input type="text" {...register('category')} className={INPUT_BASE} placeholder="카테고리 (선택)" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">공개 상태 *</label>
                <select {...register('status')} className={INPUT_BASE}>
                  <option value="PUBLISHED">공개</option>
                  <option value="PRIVATE">비공개</option>
                  <option value="DRAFT">초안</option>
                </select>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className={BTN_PRIMARY}>
                  {createMutation.isPending || updateMutation.isPending ? '저장 중...' : editingVideo ? '수정' : '등록'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingVideo(null)
                    reset()
                  }}
                  className={BTN_SECONDARY}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-lg font-semibold text-gray-900">{t('loading')}</div>
        ) : videos && videos.content.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.content.map((video) => {
              const thumbnailUrl = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
              return (
              <div key={video.id} className={CARD_MEDIA_SHELL}>
                {thumbnailUrl ? (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={thumbnailUrl}
                      alt={video.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="rounded-t-xl object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-t-xl bg-gray-100 text-sm text-gray-600">
                    썸네일 없음
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                  </div>
                  {video.category ? (
                    <span className="mb-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-700">{video.category}</span>
                  ) : null}
                  {video.description ? <p className={`${TEXT_SUB} mb-2 line-clamp-2`}>{video.description}</p> : null}
                  <div className="mb-3">
                    <VideoVisibilitySwitch video={video} />
                  </div>
                  <div className={`${TEXT_SUB} mb-4 flex flex-col gap-1`}>
                    <span>조회수: {video.viewCount}</span>
                    <span>좋아요: {video.likeCount}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEdit(video)} className={`${BTN_SECONDARY} flex-1 justify-center`}>
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(video.id)}
                      className="flex-1 rounded-lg border border-red-100 bg-white px-4 py-2 text-sm font-medium text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        ) : (
          <div className={CARD_BASE}>
            <p className={`${TEXT_SUB} mb-4 text-center text-base`}>등록된 영상이 없습니다</p>
            <button type="button" onClick={() => setShowCreateForm(true)} className={`${BTN_PRIMARY} mx-auto flex`}>
              첫 영상 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
