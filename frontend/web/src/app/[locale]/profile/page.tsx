'use client'

import { useQuery } from '@tanstack/react-query'
import { videoApi } from '../../../lib/api/videos'
import { authApi } from '../../../lib/api/auth'
import { useRouter } from '../../../i18n.config'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/login')
      return
    }
    // TODO: 토큰에서 userId 추출
    setUserId(1) // 임시
  }, [router])

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos', userId],
    queryFn: () => videoApi.getVideos({ userId: userId ?? undefined, page: 0, size: 20 }),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t('profile')}</h1>

        <div className="mb-8">
          <button
            onClick={() => {
              authApi.logout()
              router.push('/')
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {t('logout')}
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('videos')}</h2>
          {videos && videos.content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.content.map((video) => (
                <div key={video.id} className="border rounded-lg overflow-hidden">
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{video.title}</h3>
                    <div className="text-sm text-gray-600">
                      <p>조회수: {video.viewCount}</p>
                      <p>좋아요: {video.likeCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">등록된 영상이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
