'use client'

import { useQuery } from '@tanstack/react-query'
import { videoApi } from '../../../lib/api/videos'
import { authApi } from '../../../lib/api/auth'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth/authStore'
import { ProfileManageForm } from '@/components/profile/ProfileManageForm'
import { ChannelPublicSettings } from '@/components/channel/ChannelPublicSettings'
import { VideoVisibilitySwitch } from '@/components/channel/VideoVisibilitySwitch'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'

export default function ProfilePage() {
  const router = useRouter()
  const role = useAuthStore((s) => s.role)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/login')
      return
    }
    setHasToken(true)
  }, [router])

  const showApplicantVideos = role === 'APPLICANT' || role === 'ADMIN'
  const { data: videos, isLoading } = useQuery({
    queryKey: channelVideoKeys.mineMobileProfile,
    queryFn: () => videoApi.getMyChannelVideos(),
    enabled: hasToken && showApplicantVideos,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  if (hasToken && role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">내 프로필</h1>
          <button
            type="button"
            onClick={async () => {
              await authApi.logout()
              router.push('/')
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            로그아웃
          </button>
        </div>

        <ProfileManageForm />

        {showApplicantVideos ? <ChannelPublicSettings /> : null}

        <div>
          <h2 className="text-2xl font-semibold mb-4">내 영상</h2>
          {showApplicantVideos && isLoading ? (
            <p className="text-gray-500">로딩 중...</p>
          ) : role === 'AGENCY' ? (
            <p className="text-gray-500">지원자 전용 채널입니다. 기획사 계정은 오디션 관리 메뉴를 이용해 주세요.</p>
          ) : showApplicantVideos && videos && videos.content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.content.map((video) => {
                const thumbnailUrl = resolveVideoThumbnailUrl(video.videoUrl, video.thumbnailUrl)
                return (
                <div key={video.id} className="border rounded-lg overflow-hidden">
                  {thumbnailUrl ? (
                    <Image
                      src={thumbnailUrl}
                      alt={video.title}
                      width={640}
                      height={192}
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-sm text-gray-600">
                      썸네일 없음
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{video.title}</h3>
                    <div className="mb-2">
                      <VideoVisibilitySwitch video={video} />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>조회수: {video.viewCount}</p>
                      <p>좋아요: {video.likeCount}</p>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          ) : showApplicantVideos ? (
            <p className="text-gray-500">등록된 영상이 없습니다</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
