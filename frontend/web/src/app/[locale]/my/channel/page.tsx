'use client'

import { useState, useEffect } from 'react'
import { useRouter as useNextRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { videoApi, VideoContent } from '@/shared/api/videos'
import { userApi } from '@/shared/api/user'
import { authApi } from '@/shared/api/auth'
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
} from '@/shared/ui/specClasses'
import { ChannelSettingsPanel } from '@/components/channel/ChannelSettingsPanel'
import { ChannelMeStudioForm } from '@/components/channel/ChannelMeStudioForm'
import { invalidateAfterChannelVideoMutation } from '@/shared/query/channelVideoQuery'
import { ChannelMyVideoList } from '@/components/channel/ChannelMyVideoList'

const BTN_PRIMARY =
  'rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50'
const BLOCK_FORM = 'w-full border-b border-neutral-200 py-4'
const SECTION_DIVIDER = 'border-b border-neutral-200'

function createVideoSchema(titleRequired: string, youtubeInvalid: string) {
  return z.object({
    title: z.string().min(1, titleRequired),
    description: z.string().optional(),
    videoUrl: z.string().url(youtubeInvalid),
    category: z.string().optional(),
    status: z.enum(['PUBLISHED', 'DRAFT', 'PRIVATE']),
  })
}

type VideoFormData = z.infer<ReturnType<typeof createVideoSchema>>

export default function MyChannelStudioPage() {
  const router = useRouter()
  const nextRouter = useNextRouter()
  const t = useTranslations('common')
  const tCh = useTranslations('myChannel')
  const tEditor = useTranslations('editor')
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
    resolver: zodResolver(createVideoSchema(tCh('titleRequiredMsg'), tCh('youtubeInvalid'))),
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
      } catch (err: unknown) {
        console.error('Auth check failed:', err)
        const ax = err as { response?: { status?: number } }
        if (ax.response?.status === 401) {
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
    } catch (err) {
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
    if (!confirm(tCh('confirmDelete'))) return
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
    <div className="min-h-screen w-full bg-white">
      <div className={`w-full px-3 py-3 ${SECTION_GAP}`}>
        <h1 className={TITLE_PAGE}>{tCh('title')}</h1>

        <ChannelMeStudioForm />

        <div className={SECTION_DIVIDER} aria-hidden />

        <ChannelSettingsPanel />

        <div className={SECTION_DIVIDER} aria-hidden />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-neutral-900">{tCh('videos')}</h2>
          <button type="button" onClick={openUploadForm} className={`${BTN_PRIMARY} w-full shrink-0 sm:w-auto`}>
            {tCh('upload')}
          </button>
        </div>

        {showCreateForm && (
          <div className={BLOCK_FORM}>
            <h2 className={`${TITLE_PAGE} mb-3`}>{editingVideo ? tCh('editVideo') : tCh('addVideo')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">{tCh('titleRequired')}</label>
                <input type="text" {...register('title')} className={INPUT_BASE} placeholder={tCh('titlePlaceholder')} />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">{tCh('description')}</label>
                <textarea {...register('description')} rows={4} className={INPUT_BASE} placeholder={tCh('descriptionPlaceholder')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">{tCh('youtubeRequired')}</label>
                <input
                  type="url"
                  {...register('videoUrl')}
                  className={INPUT_BASE}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.videoUrl && <p className="mt-1 text-sm text-red-600">{errors.videoUrl.message}</p>}
                <p className={`${TEXT_SUB} mt-1`}>{tCh('youtubeHint')}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">{tCh('category')}</label>
                <input type="text" {...register('category')} className={INPUT_BASE} placeholder={tCh('categoryPlaceholder')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">{tCh('visibilityRequired')}</label>
                <select {...register('status')} className={INPUT_BASE}>
                  <option value="PUBLISHED">{tCh('published')}</option>
                  <option value="PRIVATE">{tCh('private')}</option>
                  <option value="DRAFT">{tCh('draft')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className={`${BTN_PRIMARY} w-full md:flex-1`}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? tEditor('saving')
                    : editingVideo
                      ? t('edit')
                      : tCh('register')}
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
                  {t('cancel')}
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
