'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { channelApi } from '@/lib/api/channel'
import { listPublicVideosForChannel } from '@/lib/api/channelVideoPublic'
import { channelVideoKeys } from '@/lib/query/channelVideoQuery'
import { ChannelPublicVideoList } from '@/components/channel/ChannelPublicVideoList'

type TabId = 'videos' | 'info'

function formatCount(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n)
}

function avatarFallbackLabel(nickname: string | undefined, displayName: string): string {
  const s = (nickname ?? displayName ?? '?').trim()
  return s.slice(0, 1).toUpperCase()
}

export default function ChannelByUserIdPage() {
  const params = useParams()
  const userId = typeof params.userId === 'string' ? params.userId : ''
  const [tab, setTab] = useState<TabId>('videos')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-channel', userId],
    queryFn: () => channelApi.getPublic(userId),
    enabled: userId.length > 0,
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

  const displayVideos = useMemo(() => {
    if (publicVideosFromApi.length > 0) return publicVideosFromApi
    return embeddedVideos
  }, [publicVideosFromApi, embeddedVideos])

  const stats = useMemo(() => {
    if (!data) return { videos: 0, subs: 0 }
    const subs = data.subscriberCount ?? 0
    const list = displayVideos
    const vCount = videosLoading && list.length === 0 ? (data.videoCount ?? 0) : list.length
    return { videos: vCount, subs }
  }, [data, displayVideos, videosLoading])

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
  const name = data.name?.trim()
  const intro = data.introText?.trim()
  const profileUrl = data.profileImageUrl ?? undefined

  return (
    <div className="min-h-screen w-full bg-white">
      {/* 슬림 채널 헤더 — 풀 가로 */}
      <header className="w-full border-b border-neutral-200 bg-white px-3 py-2">
        <div className="flex w-full items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-200">
            {profileUrl ? (
              <Image src={profileUrl} alt="" fill className="object-cover" unoptimized sizes="56px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-600">
                {avatarFallbackLabel(data.nickname ?? undefined, data.displayName)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-neutral-900">{nickname}</h1>
            <p className="mt-0.5 text-xs text-neutral-600">
              구독자 {formatCount(stats.subs)}명 · 영상 {formatCount(stats.videos)}개
            </p>
          </div>
          <button
            type="button"
            disabled
            title="곧 제공 예정"
            className="shrink-0 rounded-full border border-neutral-300 bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-600 cursor-not-allowed"
          >
            구독
          </button>
        </div>
      </header>

      {/* 탭 — 풀 가로, 하단 보더만 */}
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
            {tab === id ? (
              <span className="absolute inset-x-1 bottom-0 h-0.5 bg-neutral-900" />
            ) : null}
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
            <section className="py-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-neutral-500">닉네임</dt>
                  <dd className="mt-0.5 font-medium text-neutral-900">{nickname}</dd>
                </div>
                {name ? (
                  <div>
                    <dt className="text-xs text-neutral-500">이름</dt>
                    <dd className="mt-0.5 font-medium text-neutral-900">{name}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
            {!intro && !data.channelDescription?.trim() ? (
              <p className="py-2 text-sm text-neutral-500">등록된 상세 정보가 없습니다.</p>
            ) : null}
          </div>
        ) : (
          <ChannelPublicVideoList
            videosLoading={videosLoading}
            videosError={videosError}
            displayVideos={displayVideos}
            channelDisplayName={nickname}
            channelProfileImageUrl={profileUrl ?? null}
          />
        )}
      </div>
    </div>
  )
}
