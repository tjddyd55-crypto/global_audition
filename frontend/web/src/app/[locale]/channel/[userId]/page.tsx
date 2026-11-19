'use client'

import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { channelApi } from '@/shared/api/channel'
import { listPublicVideosForChannel, postChannelSubscribe, deleteChannelSubscribe } from '@/shared/api/channelVideoPublic'
import { channelVideoKeys } from '@/shared/query/channelVideoQuery'
import { ChannelVideoTheater } from '@/components/channel/ChannelVideoTheater'
import { ChannelCareerList } from '@/components/channel/ChannelCareerList'
import { ChannelMetaLine } from '@/components/channel/ChannelMeta'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'
import { formatNationalityLabel, knownNationalityCode } from '@/shared/channel/nationalityDisplay'
import { useLocale, useTranslations } from 'next-intl'
import { formatCount } from '@/shared/money/currency'
import { userApi } from '@/shared/api/user'
import { authApi } from '@/shared/api/auth'
import { DEFAULT_IMAGES } from '@/shared/constants/fallbacks'
import { TranslationNotice, translatedText, useContentTranslation } from '@/components/i18n/TranslatedField'

type TabId = 'videos' | 'profile' | 'career'

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
  const t = useTranslations('channel')
  const tNat = useTranslations('nationality')
  const tField = useTranslations('recruitField')
  const tLang = useTranslations('languages')
  const locale = useLocale()
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

  const agencyCopy = useContentTranslation('AGENCY_PROFILE', userId)
  const userCopy = useContentTranslation('USER_INTRO', userId)
  const channelCopy = useContentTranslation('CHANNEL_DESCRIPTION', data?.channelId)

  const featuredId = data?.featuredVideo?.videoId ?? data?.featuredVideoId ?? null

  const displayVideos = useMemo(
    () => (publicVideosFromApi.length > 0 ? publicVideosFromApi : embeddedVideos),
    [publicVideosFromApi, embeddedVideos],
  )

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
    const title = data?.nickname?.trim() || data?.displayName || t('title')
    const r = await shareOrCopyChannelPage(url, title)
    if (r === 'copied') setShareHint(t('copied'))
    else if (r === 'shared') setShareHint(null)
    else if (r === 'noop') setShareHint(t('shareFailed'))
    setTimeout(() => setShareHint(null), 2500)
  }, [data?.displayName, data?.nickname, t])

  if (!userId) {
    return (
      <div className="w-full py-10">
        <p className="px-3 text-sm text-neutral-600">{t('invalidUrl')}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <p className="px-3 text-sm text-neutral-700">{t('loadingProfile')}</p>
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
          {blocked ? t('privateNotice') : t('loadFailed')}
        </p>
        <p className="mt-1 px-3 text-sm text-neutral-600">
          {blocked ? t('privateHint') : t('retryLater')}
        </p>
      </div>
    )
  }

  const nickname = data.nickname?.trim() || data.displayName
  const nat = (data.nationality ?? data.country ?? '').trim() || null
  const shortBio = data.shortBio?.trim() ?? ''
  const longBio = agencyCopy.view
    ? translatedText(data.bio, agencyCopy.view, 'bio', agencyCopy.showOriginal)
    : (data.bio?.trim() ?? '')
  const categories = data.categories ?? []
  const introSource = agencyCopy.view ? agencyCopy : userCopy
  const intro = translatedText(data.introText, introSource.view, 'introText', introSource.showOriginal).trim()
  const channelDesc = translatedText(data.channelDescription, channelCopy.view, 'description', channelCopy.showOriginal).trim()
  const profileSrc = data.profileImageUrl?.trim() || DEFAULT_IMAGES.avatar
  const banner = data.bannerImageUrl?.trim() || ''
  const natCode = knownNationalityCode(nat)
  const resCode = knownNationalityCode(data.residenceCountry ?? null)
  const facts: Array<[string, string]> = []
  if (natCode) facts.push([t('profileNationality'), formatNationalityLabel(natCode, tNat(natCode))])
  if (resCode) facts.push([t('profileResidence'), formatNationalityLabel(resCode, tNat(resCode))])
  if (data.ageBand) facts.push([t('profileAge'), t(`ageBand.${data.ageBand}`)])
  if ((data.languages ?? []).length) facts.push([t('profileLanguages'), (data.languages ?? []).map((l) => tLang(l)).join(', ')])
  if (categories.length) facts.push([t('profileSpecialties'), categories.map((c) => recruitFieldLabel(c, (k) => tField(k))).join(', ')])
  if ((data.activityFields ?? []).length) facts.push([t('category'), (data.activityFields ?? []).join(', ')])
  const talents = data.talents?.trim() ?? ''
  const hasProfile = facts.length > 0 || !!longBio || !!intro || !!channelDesc || !!talents || (data.snsLinks ?? []).length > 0

  const section = (title: string, text: string, notice?: React.ReactNode) => (
    <section className="border-b border-neutral-100 py-4 last:border-b-0">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">{text}</p>
      {notice}
    </section>
  )

  return (
    <div className="min-h-screen w-full bg-white" data-testid="channel-detail">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-r from-violet-200 via-fuchsia-100 to-amber-100 sm:h-44 md:rounded-b-2xl">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="" className="h-full w-full object-cover" data-testid="channel-banner" />
          ) : null}
        </div>
        <div className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-end">
          <div className="relative -mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-neutral-200 sm:-mt-12 sm:h-28 sm:w-28">
            <Image src={profileSrc} alt="" fill className="object-cover" sizes="112px" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold text-neutral-900 sm:text-2xl">{nickname}</h1>
            <ChannelMetaLine
              nationality={nat}
              residence={data.residenceCountry}
              mainField={data.mainField}
              className="mt-1 text-sm text-neutral-600"
            />
            {shortBio ? <p className="mt-1 break-words text-sm text-neutral-700">{shortBio}</p> : null}
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600" data-testid="channel-stats">
              <div className="flex gap-1">
                <dt>{t('statVideos')}</dt>
                <dd className="font-semibold text-neutral-900">{formatCount(data.videoCount ?? 0, locale)}</dd>
              </div>
              <div className="flex gap-1">
                <dt>{t('statFollowers')}</dt>
                <dd className="font-semibold text-neutral-900">{formatCount(data.subscriberCount ?? 0, locale)}</dd>
              </div>
              <div className="flex gap-1" title={t('viewsInternalHint')}>
                <dt>{t('statViews')}</dt>
                <dd className="font-semibold text-neutral-900">{formatCount(data.viewCount ?? 0, locale)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:shrink-0">
            {isOwnChannel ? (
              <button
                type="button"
                className="h-10 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white"
                onClick={() => router.push('/my/studio/channel')}
                data-testid="channel-manage"
              >
                {t('manage')}
              </button>
            ) : (
              <button
                type="button"
                disabled={subMutation.isPending}
                data-testid="channel-follow"
                onClick={() => {
                  if (!me) {
                    router.push('/login')
                    return
                  }
                  subMutation.mutate()
                }}
                className={`h-10 max-w-full rounded-full px-4 text-sm font-semibold disabled:opacity-50 ${
                  data.subscribed ? 'border border-neutral-300 bg-white text-neutral-900' : 'bg-neutral-900 text-white'
                }`}
              >
                {!me ? t('loginToFollow') : data.subscribed ? t('following') : t('follow')}
              </button>
            )}
            <button
              type="button"
              onClick={() => void onShare()}
              className="h-10 rounded-full border border-neutral-300 px-4 text-sm font-semibold text-neutral-900"
            >
              {t('share')}
            </button>
          </div>
        </div>
        {shareHint ? <p className="px-4 pb-2 text-xs text-neutral-600">{shareHint}</p> : null}

        <div className="flex w-full gap-1 border-b border-neutral-200 px-2" role="tablist">
          {(
            [
              ['videos', t('tabVideos')],
              ['profile', t('tabProfile')],
              ['career', t('tabCareer')],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              data-testid={`channel-tab-${id}`}
              onClick={() => setTab(id)}
              className={`relative -mb-px min-w-0 flex-1 rounded-t-lg border px-2 py-2.5 text-sm font-semibold sm:flex-none sm:px-6 ${
                tab === id
                  ? 'border-neutral-200 border-b-white bg-white text-neutral-900'
                  : 'border-transparent bg-neutral-50 text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span className="block truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="w-full bg-white pb-10">
          {tab === 'videos' ? (
            <ChannelVideoTheater videos={displayVideos} featuredId={featuredId} loading={videosLoading} error={videosError} />
          ) : tab === 'career' ? (
            <ChannelCareerList careers={data.careers ?? []} legacyText={data.careerText} />
          ) : (
            <div className="px-3 py-2" data-testid="channel-profile-tab">
              {facts.length ? (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-b border-neutral-100 py-4 sm:grid-cols-2">
                  {facts.map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-xs font-semibold text-neutral-500">{k}</dt>
                      <dd className="break-words text-sm text-neutral-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {longBio
                ? section(
                    t('profileIntro'),
                    longBio,
                    <TranslationNotice view={agencyCopy.view} showOriginal={agencyCopy.showOriginal} onToggle={agencyCopy.setShowOriginal} />,
                  )
                : null}
              {intro
                ? section(
                    t('extraIntroTab'),
                    intro,
                    <TranslationNotice view={introSource.view} showOriginal={introSource.showOriginal} onToggle={introSource.setShowOriginal} />,
                  )
                : null}
              {channelDesc
                ? section(
                    t('description'),
                    channelDesc,
                    <TranslationNotice view={channelCopy.view} showOriginal={channelCopy.showOriginal} onToggle={channelCopy.setShowOriginal} />,
                  )
                : null}
              {talents ? section(t('profileTalents'), talents) : null}
              {data.snsLinks && data.snsLinks.length > 0 ? (
                <section className="py-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('profileSns')}</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {data.snsLinks.map((l, i) => (
                      <li key={`${l.platform}-${i}`}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center rounded-full border border-neutral-300 px-3 text-sm font-medium text-neutral-800"
                        >
                          {l.platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {!hasProfile ? <p className="py-6 text-sm text-neutral-500">{t('profileEmpty')}</p> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
