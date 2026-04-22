'use client'

import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { channelApi } from '@/shared/api/channel'
import { listPublicVideosForChannel, postChannelSubscribe, deleteChannelSubscribe } from '@/shared/api/channelVideoPublic'
import { channelVideoKeys } from '@/shared/query/channelVideoQuery'
import { ChannelPublicVideoList } from '@/components/channel/ChannelPublicVideoList'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { nationalityLabelKo } from '@/shared/channel/nationalityDisplay'
import { userApi } from '@/shared/api/user'
import { authApi } from '@/shared/api/auth'
import { DEFAULT_IMAGES } from '@/shared/constants/fallbacks'

type TabId = 'videos' | 'info'

function formatCount(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

async function shareOrCopyChannelPage(url: string, title: string): Promise<'shared' | 'copied' | 'noop'> {
  if (typeof window === 'undefined') return 'noop'
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: title, url })
      return 'shared'
    } catch (e) {
      const err = e as { name?: string }
      if (err?.name === 'AbortError') return 'noop'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'noop'
  }
}

export default function ChannelByUserIdPage() {
  const params = useParams()
  const userId = typeof params.userId === 'string' ? params.userId : ''
  const [tab, setTab] = useState<TabId>('videos')
  const [shareHint, setShareHint] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-channel', userId],
    queryFn: () => channelApi.getPublic(userId),
    enabled: userId.length > 0,
    retry: false,
  })

  const { data: me } = useQuery({
    queryKey: ['channel-viewer-me', userId],
    queryFn: () => userApi.getCurrentUser(),
    enabled: userId.length > 0 && !!authApi.getToken(),
    retry: false,
  })

  const {
    data: publicVideosFromApi = [],
    isLoading: videosLoading,
    isError: videosError,
  } = useQuery({
    queryKey: channelVideoKeys.publicList(userId),
    queryFn: () => listPublicVideosForChannel(userId),
    enabled: userId.length > 0,
    retry: 1,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const embeddedVideos = useMemo(() => data?.videos ?? [], [data?.videos])

  const featuredId = data?.featuredVideo?.videoId ?? null

  const displayVideos = useMemo(() => {
    const raw = publicVideosFromApi.length > 0 ? publicVideosFromApi : embeddedVideos
    if (!featuredId) return raw
    return raw.filter((v) => v.videoId !== featuredId)
  }, [publicVideosFromApi, embeddedVideos, featuredId])

  const embedSrc = useMemo(() => {
    const url = data?.featuredVideo?.videoUrl
    if (!url) return null
    return getVideoEmbedSrc(url)
  }, [data?.featuredVideo?.videoUrl])

  const stats = useMemo(() => {
    if (!data) return { videos: 0, subs: 0 }
    return {
      videos: data.videoCount ?? 0,
      subs: data.subscriberCount ?? 0,
    }
  }, [data])

  const isOwnChannel = Boolean(me?.userId && userId && me.userId === userId)

  const subMutation = useMutation({
    mutationFn: async () => {
      if (data?.subscribed) {
        return deleteChannelSubscribe(userId)
      }
      return postChannelSubscribe(userId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['public-channel', userId] })
      await queryClient.invalidateQueries({ queryKey: channelVideoKeys.publicList(userId) })
    },
  })

  const onShare = useCallback(async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const title = data?.nickname?.trim() || data?.displayName || '채널'
    const r = await shareOrCopyChannelPage(url, title)
    if (r === 'copied') setShareHint('링크를 복사했습니다.')
    else if (r === 'shared') setShareHint(null)
    else if (r === 'noop') setShareHint('공유/복사를 할 수 없습니다.')
    setTimeout(() => setShareHint(null), 2500)
  }, [data?.displayName, data?.nickname])

  if (!userId) {
    return (
      <div className="w-full py-10">
        <p className="px-3 text-sm text-neutral-600">잘못된 주소입니다.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <p className="px-3 text-sm text-neutral-700">프로필을 불러오는 중…</p>
      </div>
    )
  }

  if (isError || !data) {
    const blocked =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status === 404
        : false
    return (
      <div className="w-full py-12">
        <p className="px-3 text-base font-medium text-neutral-900">
          {blocked ? '이 채널은 비공개입니다' : '채널을 불러오지 못했습니다'}
        </p>
        <p className="mt-1 px-3 text-sm text-neutral-600">
          {blocked
            ? '크리에이터가 채널 공개를 하지 않았거나 주소가 잘못되었을 수 있습니다.'
            : '잠시 후 다시 시도해 주세요.'}
        </p>
      </div>
    )
  }

  const nickname = data.nickname?.trim() || data.displayName
  const nat = (data.nationality ?? data.country ?? '').trim()
  const natLabel = nationalityLabelKo(nat || null)
  const shortBio = data.shortBio?.trim() ?? ''
  const longBio = data.bio?.trim() ?? ''
  const categories = (data.categories ?? []).slice(0, 3)
  const intro = data.introText?.trim()
  const profileSrc = data.profileImageUrl?.trim() || DEFAULT_IMAGES.avatar

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200">
          <Image src={profileSrc} alt="" fill className="object-cover" sizes="64px" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-neutral-900">{nickname}</div>
              {natLabel ? <div className="mt-1 text-sm text-gray-500">{natLabel}</div> : null}
              {shortBio ? (
                <div className="mt-2 truncate text-sm text-gray-700" title={shortBio}>
                  {shortBio}
                </div>
              ) : null}
              {categories.length > 0 ? (
                <div className="mt-1 text-sm text-gray-700">{categories.join(' · ')}</div>
              ) : null}
              <div className="mt-2 text-sm text-gray-500">
                구독자 {formatCount(stats.subs)} · 영상 {formatCount(stats.videos)}
              </div>
            </div>
            <div className="ml-3 flex shrink-0 gap-2">
              {isOwnChannel ? (
                <button
                  type="button"
                  className="rounded-full border border-neutral-900 bg-black px-3 py-1 text-sm text-white"
                  onClick={() => router.push('/my/channel')}
                >
                  채널 관리
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!me || subMutation.isPending}
                  onClick={() => {
                    if (!me) {
                      router.push('/login')
                      return
                    }
                    subMutation.mutate()
                  }}
                  className="rounded-full bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  {!me ? '로그인 후 구독' : data.subscribed ? '구독 취소' : '구독'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void onShare()}
                className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-900"
              >
                공유
              </button>
            </div>
          </div>
          {shareHint ? <p className="mt-2 text-xs text-neutral-600">{shareHint}</p> : null}
        </div>
      </div>

      {embedSrc ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            title="대표 영상"
            src={embedSrc}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}

      <div className="flex w-full border-b border-neutral-200 px-1">
        {(
          [
            ['videos', '영상'],
            ['info', '정보'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`relative flex-1 px-2 py-2.5 text-sm font-medium ${
              tab === id ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {label}
            {tab === id ? <span className="absolute inset-x-1 bottom-0 h-0.5 bg-neutral-900" /> : null}
          </button>
        ))}
      </div>

      <div className="w-full bg-white">
        {tab === 'info' ? (
          <div className="w-full space-y-0 px-3 py-4">
            {longBio ? (
              <section className="border-b border-neutral-100 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">채널 소개</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{longBio}</p>
              </section>
            ) : null}
            {intro ? (
              <section className="border-b border-neutral-100 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">추가 소개</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{intro}</p>
              </section>
            ) : null}
            {data.channelDescription?.trim() ? (
              <section className="border-b border-neutral-100 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">채널 설명</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                  {data.channelDescription.trim()}
                </p>
              </section>
            ) : null}
            {data.snsLinks && data.snsLinks.length > 0 ? (
              <section className="border-b border-neutral-100 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">SNS</h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {data.snsLinks.map((l, i) => (
                    <li key={`${l.platform}-${i}`}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
                      >
                        {l.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {!longBio && !intro && !data.channelDescription?.trim() && (!data.snsLinks || data.snsLinks.length === 0) ? (
              <p className="py-2 text-sm text-neutral-500">등록된 상세 정보가 없습니다.</p>
            ) : null}
          </div>
        ) : (
          <ChannelPublicVideoList
            videosLoading={videosLoading}
            videosError={videosError}
            displayVideos={displayVideos}
            channelDisplayName={nickname}
            channelProfileImageUrl={data.profileImageUrl ?? null}
          />
        )}
      </div>
    </div>
  )
}
