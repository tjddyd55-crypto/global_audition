'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { channelApi } from '@/lib/api/channel'
import { listPublicVideosForChannel } from '@/lib/api/channelVideoPublic'
import { PAGE_CONTAINER } from '@/lib/ui/specClasses'
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

  /** 전용 API 우선(동일 DB); 로딩·구버전 API 대비로 채널 응답 내 videos 폴백 */
  const displayVideos = useMemo(() => {
    if (publicVideosFromApi.length > 0) return publicVideosFromApi
    return embeddedVideos
  }, [publicVideosFromApi, embeddedVideos])

  const stats = useMemo(() => {
    if (!data) return { videos: 0, subs: 0, views: 0 }
    const subs = data.subscriberCount ?? 0
    const list = displayVideos
    const vCount = videosLoading && list.length === 0 ? (data.videoCount ?? 0) : list.length
    const views =
      videosLoading && list.length === 0
        ? (data.viewCount ?? 0)
        : list.reduce((acc, v) => acc + Number(v.viewCount ?? 0), 0)
    return { videos: vCount, subs, views }
  }, [data, displayVideos, videosLoading])

  if (!userId) {
    return (
      <div className={`${PAGE_CONTAINER} py-12`}>
        <p className="text-sm text-neutral-600">잘못된 주소입니다.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${PAGE_CONTAINER} py-16`}>
        <p className="text-base font-medium text-neutral-700">프로필을 불러오는 중…</p>
      </div>
    )
  }

  if (isError || !data) {
    const blocked =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status === 404
        : false
    return (
      <div className={`${PAGE_CONTAINER} py-16`}>
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-neutral-900">
            {blocked ? '이 채널은 비공개입니다' : '채널을 불러오지 못했습니다'}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {blocked ? '크리에이터가 채널 공개를 하지 않았거나 주소가 잘못되었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
          </p>
        </div>
      </div>
    )
  }

  const nickname = data.nickname?.trim() || data.displayName
  const name = data.name?.trim()
  const intro = data.introText?.trim()
  const profileUrl = data.profileImageUrl ?? undefined

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className={PAGE_CONTAINER}>
        {/* 프로필 헤더 */}
        <section className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-800 px-4 py-6 shadow-xl sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_55%)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-2xl ring-4 ring-white/35 sm:mx-0 sm:h-28 sm:w-28 md:h-32 md:w-32">
                {profileUrl ? (
                  <Image src={profileUrl} alt="" fill className="object-cover" unoptimized sizes="128px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/20 text-3xl font-bold text-white md:text-4xl">
                    {avatarFallbackLabel(data.nickname ?? undefined, data.displayName)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Creator</p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-white md:text-3xl">{nickname}</h1>
                {name && name !== nickname ? (
                  <p className="mt-1 text-sm text-white/85">{name}</p>
                ) : null}
                {intro ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/90 md:line-clamp-none">{intro}</p>
                ) : null}

                <dl className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:max-w-xl sm:gap-6">
                  <div className="rounded-xl bg-white/10 px-2 py-2 text-center sm:text-left">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-white/65 sm:text-xs">영상</dt>
                    <dd className="mt-0.5 text-base font-bold tabular-nums text-white sm:text-lg">{formatCount(stats.videos)}</dd>
                  </div>
                  <div className="rounded-xl bg-white/10 px-2 py-2 text-center sm:text-left">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-white/65 sm:text-xs">구독자</dt>
                    <dd className="mt-0.5 text-base font-bold tabular-nums text-white sm:text-lg">{formatCount(stats.subs)}</dd>
                  </div>
                  <div className="rounded-xl bg-white/10 px-2 py-2 text-center sm:text-left">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-white/65 sm:text-xs">조회수</dt>
                    <dd className="mt-0.5 text-base font-bold tabular-nums text-white sm:text-lg">{formatCount(stats.views)}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="flex w-full shrink-0 justify-center md:w-auto md:justify-end">
              <button
                type="button"
                disabled
                title="곧 제공 예정"
                className="w-full max-w-xs rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-violet-700 shadow-md opacity-90 cursor-not-allowed md:w-auto"
              >
                구독
              </button>
            </div>
          </div>
        </section>

        {/* 탭 */}
        <div className="mt-6 flex gap-1 border-b border-neutral-200 bg-white/80 px-1 sm:rounded-t-xl sm:border sm:border-b-0 sm:border-neutral-200/80">
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
              className={`relative px-4 py-3 text-sm font-semibold transition-colors sm:px-6 ${
                tab === id ? 'text-violet-700' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {label}
              {tab === id ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-violet-600 sm:inset-x-4" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="border border-t-0 border-neutral-200/80 bg-white px-3 py-6 sm:rounded-b-xl sm:px-6 sm:py-8">
          {tab === 'info' ? (
            <div className="mx-auto max-w-2xl space-y-6">
              {intro ? (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">소개</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{intro}</p>
                </section>
              ) : null}
              {data.channelDescription?.trim() ? (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">채널 소개</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{data.channelDescription.trim()}</p>
                </section>
              ) : null}
              {data.snsLinks && data.snsLinks.length > 0 ? (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">SNS</h2>
                  <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {data.snsLinks.map((l, i) => (
                      <li key={`${l.platform}-${i}`}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100"
                        >
                          {l.platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <section className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4 text-sm text-neutral-700">
                <dl className="grid gap-3 sm:grid-cols-2">
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
                <p className="text-center text-sm text-neutral-500">등록된 상세 정보가 없습니다.</p>
              ) : null}
            </div>
          ) : (
            <ChannelPublicVideoList
              videosLoading={videosLoading}
              videosError={videosError}
              displayVideos={displayVideos}
            />
          )}
        </div>
      </div>
    </div>
  )
}
