'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videoApi, VideoContent } from '../../../lib/api/videos'
import { userApi } from '../../../lib/api/user'
import { authApi } from '../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
  const [userId, setUserId] = useState<number | null>(null)
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
      status: 'PUBLISHED',
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
        if (user.userType !== 'APPLICANT') {
          router.push('/')
          return
        }

        setUserType(user.userType)
        setUserId(user.id)
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
    queryKey: ['videos', userId],
    queryFn: () => videoApi.getVideos({ userId: userId ?? undefined, page: 0, size: 100 }),
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: (data: VideoFormData) => {
      // userId는 백엔드에서 JWT 토큰에서 추출하므로 여기서는 전달하지 않음
      return videoApi.createVideo({
        ...data,
        status: data.status as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', userId] })
      setShowCreateForm(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => videoApi.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', userId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: VideoFormData }) =>
      videoApi.updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos', userId] })
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

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteMutation.mutateAsync(id)
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'APPLICANT') {
    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">내 채널 관리</h1>
          <button
            onClick={() => {
              setEditingVideo(null)
              reset()
              setShowCreateForm(true)
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + 영상 추가
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {editingVideo ? '영상 수정' : '새 영상 추가'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목 *</label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="영상 제목"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="영상 설명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL *</label>
                <input
                  type="url"
                  {...register('videoUrl')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {errors.videoUrl && (
                  <p className="text-red-500 text-sm mt-1">{errors.videoUrl.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  YouTube 영상 URL을 입력해주세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <input
                  type="text"
                  {...register('category')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="카테고리 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">공개 상태 *</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="PUBLISHED">공개</option>
                  <option value="PRIVATE">비공개</option>
                  <option value="DRAFT">초안</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? '저장 중...' : editingVideo ? '수정' : '등록'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingVideo(null)
                    reset()
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl">{t('loading')}</div>
          </div>
        ) : videos && videos.content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.content.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {video.thumbnailUrl && (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500 mb-4">
                    <p>조회수: {video.viewCount}</p>
                    <p>좋아요: {video.likeCount}</p>
                    <p>상태: {video.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(video)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">등록된 영상이 없습니다</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              첫 영상 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
