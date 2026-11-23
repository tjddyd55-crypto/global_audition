'use client'

import { useQuery } from '@tanstack/react-query'
import { channelApi } from '@/shared/api/channel'
import { auditionRecommendationsApi, recommendationQueryKeys } from '@/shared/api/auditionRecommendations'
import { useAuditionsListQuery } from '@/components/audition/useAuditionsListQuery'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import { useAuthStore } from '@/shared/auth/authStore'
import type { PublicChannelListItem } from '@/shared/api/channel'
import type { AuditionDto } from '@/shared/types/audition'
import type { RecommendedAuditionItem } from '@/shared/api/auditionRecommendations'

const HOME_LIMIT = 6

export type HomeFeed = {
  country: ReturnType<typeof useAudienceCountrySelection>['country']
  selectCountry: ReturnType<typeof useAudienceCountrySelection>['selectCountry']
  isAuthenticated: boolean
  recommended: RecommendedAuditionItem[]
  recommendedPending: boolean
  recommendedError: boolean
  personalized: boolean
  closingSoon: AuditionDto[]
  closingPending: boolean
  latest: AuditionDto[]
  latestPending: boolean
  channels: PublicChannelListItem[]
  channelsPending: boolean
}

/** 홈 공통 피드: 맞춤 추천, 마감 임박, 최근 활동 채널, 최신 공고. */
export function useHomeFeed(): HomeFeed {
  const { country, selectCountry } = useAudienceCountrySelection()
  const userId = useAuthStore((state) => state.userId)
  const accessToken = useAuthStore((state) => state.accessToken)
  const countryParam = country === 'ALL' ? undefined : country

  const recommended = useQuery({
    queryKey: recommendationQueryKeys.list(country, HOME_LIMIT, userId),
    queryFn: () => auditionRecommendationsApi.list(countryParam, HOME_LIMIT),
  })
  const closingSoon = useQuery({
    queryKey: recommendationQueryKeys.closingSoon(country, HOME_LIMIT),
    queryFn: () => auditionRecommendationsApi.closingSoon(countryParam, HOME_LIMIT),
  })
  const latestQuery = useAuditionsListQuery(country)
  const channels = useQuery({
    queryKey: ['home-channels', country],
    queryFn: () =>
      channelApi.listPublic({
        country: countryParam,
        sort: 'RECENT_ACTIVITY',
        limit: HOME_LIMIT,
        offset: 0,
      }),
  })

  const recItems = recommended.data?.items ?? []
  const closing = closingSoon.data ?? []
  const shown = new Set([...recItems.map((item) => item.audition.id), ...closing.map((row) => row.id)])
  const latest = (latestQuery.data ?? []).filter((row) => !shown.has(row.id)).slice(0, HOME_LIMIT)
  const channelRows = (channels.data ?? []).filter((row) => row.userId).slice(0, HOME_LIMIT)

  return {
    country,
    selectCountry,
    isAuthenticated: Boolean(accessToken),
    recommended: recItems,
    recommendedPending: recommended.isPending,
    recommendedError: recommended.isError,
    personalized: Boolean(recommended.data?.personalized),
    closingSoon: closing,
    closingPending: closingSoon.isPending,
    latest,
    latestPending: latestQuery.isLoading,
    channels: channelRows,
    channelsPending: channels.isPending,
  }
}
