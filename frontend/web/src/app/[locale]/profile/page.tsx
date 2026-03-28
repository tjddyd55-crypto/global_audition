'use client'

import { useQuery } from '@tanstack/react-query'
import { videoApi } from '../../../lib/api/videos'
import { authApi } from '../../../lib/api/auth'
import { useRouter } from '../../../i18n.config'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  BTN_SECONDARY,
  CARD_BASE,
  CARD_MEDIA_SHELL,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { useAuthStore } from '@/lib/auth/authStore'
import { ProfileManageForm } from '@/components/profile/ProfileManageForm'
import { ChannelPublicSettings } from '@/components/channel/ChannelPublicSettings'
import { VideoVisibilitySwitch } from '@/components/channel/VideoVisibilitySwitch'
import { resolveVideoThumbnailUrl } from '@/lib/audition/videoThumbnail'

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations('common')
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
    queryKey: ['my-channel-videos-profile'],
    queryFn: () => videoApi.getMyChannelVideos(),
    enabled: hasToken && showApplicantVideos,
  })

  if (hasToken && role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-semibold text-gray-900">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className={TITLE_PAGE}>{t('profile')}</h1>
          <button
            type="button"
            onClick={async () => {
              await authApi.logout()
              router.push('/')
            }}
            className={BTN_SECONDARY}
          >
            {t('logout')}
          </button>
        </div>

        <ProfileManageForm />

        <div>
          <h2 className={`${TITLE_PAGE} mb-4`}>{t('videos')}</h2>
          {showApplicantVideos && isLoading ? (
            <div className={CARD_BASE}>
              <p className={TEXT_SUB}>{t('loading')}</p>
            </div>
          ) : role === 'AGENCY' ? (
            <div className={CARD_BASE}>
              <p className={TEXT_SUB}>지원자 전용 채널 영역입니다. 기획사 계정은 오디션 관리 메뉴를 이용해 주세요.</p>
            </div>
          ) : showApplicantVideos && videos && videos.content.length > 0 ? (
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
                    <h3 className="text-sm font-semibold text-gray-900">{video.title}</h3>
                    <div className="mt-2">
                      <VideoVisibilitySwitch video={video} />
                    </div>
                    <div className={`${TEXT_SUB} mt-2 flex flex-col gap-1`}>
                      <span>조회수: {video.viewCount}</span>
                      <span>좋아요: {video.likeCount}</span>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          ) : showApplicantVideos ? (
            <div className={CARD_BASE}>
              <p className={TEXT_SUB}>등록된 영상이 없습니다</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
