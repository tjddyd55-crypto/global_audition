'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '../../../i18n.config'
import { useRouter as useNextRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { videoApi, VideoContent } from '../../../lib/api/videos'
import { userApi } from '../../../lib/api/user'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BTN_SECONDARY,
  INPUT_BASE,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { ChannelSettingsPanel } from '@/components/channel/ChannelSettingsPanel'
import { invalidateAfterChannelVideoMutation } from '@/lib/query/channelVideoQuery'
import { ChannelMyVideoList } from '@/components/channel/ChannelMyVideoList'

/** 채널 설정 패널과 통일: 카드 16px, primary 그라데이션 버튼 */
const BTN_UPLOAD_PRIMARY =
  'rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-105 active:scale-[0.99]'
const CARD_CHANNEL_FORM =
  'rounded-2xl border border-violet-100/90 bg-white p-5 shadow-[0_4px_24px_-4px_rgba(109,40,217,0.12)] sm:p-6'
const SECTION_DIVIDER = 'my-8 border-t border-violet-100'

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
  const nextRouter = useNextRouter()
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

  const createMutation = useMutation({
    mutationFn: (data: VideoFormData) =>
      videoApi.createVideo({
        ...data,
        status: data.status as 'PUBLISHED' | 'DRAFT' | 'PRIVATE',
      }),
    onSuccess: async () => {
      await invalidateAfterChannelVideoMutation(queryClient)
      nextRouter.refresh()
      setShowCreateForm(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoApi.deleteVideo(id),
    onSuccess: async () => {
      await invalidateAfterChannelVideoMutation(queryClient)
      nextRouter.refresh()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VideoFormData }) => videoApi.updateVideo(id, data),
    onSuccess: async () => {
      await invalidateAfterChannelVideoMutation(queryClient)
      nextRouter.refresh()
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

  const openUploadForm = () => {
    setEditingVideo(null)
    reset()
    setShowCreateForm(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/40 to-neutral-50">
      <div className={`w-full px-4 py-6 ${SECTION_GAP}`}>
        <h1 className={TITLE_PAGE}>내 채널 관리</h1>

        <ChannelSettingsPanel />

        <div className={SECTION_DIVIDER} aria-hidden />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-neutral-900">영상 관리</h2>
          <button type="button" onClick={openUploadForm} className={`${BTN_UPLOAD_PRIMARY} w-full shrink-0 sm:w-auto`}>
            + 영상 업로드
          </button>
        </div>

        {showCreateForm && (
          <div className={CARD_CHANNEL_FORM}>
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
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className={`${BTN_UPLOAD_PRIMARY} w-full md:flex-1`}
                >
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

        <ChannelMyVideoList
          loadingLabel={t('loading')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenUploadForm={openUploadForm}
        />
      </div>
    </div>
  )
}
