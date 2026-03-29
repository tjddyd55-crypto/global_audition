'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { channelApi } from '@/lib/api/channel'
import { listPublicVideosForChannel, postChannelSubscribe, deleteChannelSubscribe } from '@/lib/api/channelVideoPublic'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'
import { ChannelPublicVideoList } from '@/components/channel/ChannelPublicVideoList'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'
import { nationalityLabelKo } from '@/lib/channel/nationalityDisplay'
import { userApi } from '@/lib/api/user'
import { authApi } from '@/lib/api/auth'

type TabId = 'videos' | 'info'

function formatCount(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

export default function ChannelByUserIdPage() {
  const params = useParams()
  const userId = typeof params.userId === 'string' ? params.userId : ''
  const [tab, setTab] = useState<TabId>('videos')
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
  const bio = data.bio?.trim()
  const categories = data.categories ?? []
  const intro = data.introText?.trim()

  return (
    <div className="min-h-screen w-full bg-white">
      {embedSrc ? (
        <div className="w-full aspect-video bg-black">
          <iframe
            title="대표 영상"
            src={embedSrc}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}

      <div className="px-4 py-3 text-left">
        <h1 className="text-lg font-semibold text-neutral-900">{nickname}</h1>
        {natLabel ? <p className="mt-1 text-sm text-neutral-700">{natLabel}</p> : null}
        {bio ? <p className="mt-1 text-sm text-neutral-800">{bio}</p> : null}
        {categories.length > 0 ? (
          <p className="mt-2 text-sm text-neutral-800">{categories.join(' · ')}</p>
        ) : null}
        <p className="mt-2 text-xs text-neutral-600">
          구독자 {formatCount(stats.subs)}명 · 영상 {formatCount(stats.videos)}개
        </p>
      </div>

      <div className="px-4 pb-3">
        {isOwnChannel ? (
          <button
            type="button"
            className="w-full rounded-md border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-800"
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
            className="w-full rounded-md bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {!me ? '로그인 후 구독' : data.subscribed ? '구독 취소' : '구독'}
          </button>
        )}
      </div>

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
            {intro ? (
              <section className="border-b border-neutral-100 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">소개</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{intro}</p>
              </section>
            ) : null}
            {data.channelDescription?.trim() ? (
              <section className="border-b border-neutral-100 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">채널 소개</h2>
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
            {!intro && !data.channelDescription?.trim() && (!data.snsLinks || data.snsLinks.length === 0) ? (
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
