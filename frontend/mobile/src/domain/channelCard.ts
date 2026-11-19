import { isRenderablePosterUri } from './auditionImages'

export type PublicChannelRow = {
  userId?: string
  nickname?: string | null
  introText?: string | null
  profileImage?: string | null
  subscriberCount?: number | null
  videoCount?: number | null
  shortBio?: string | null
  nationality?: string | null
  residenceCountry?: string | null
  mainField?: string | null
  featuredThumbnailUrl?: string | null
}

export type ChannelCardView = {
  userId: string
  name: string
  intro: string
  hasIntro: boolean
  avatarUri: string | null
  initial: string
  subscribers: number
  videos: number
  nationality: string | null
  residence: string | null
  mainField: string | null
  thumbUri: string | null
}

/** 채널 목록 카드 표시값. 아바타가 없거나 RN 이 못 그리는 형식(SVG·상대경로)이면 null → 이니셜 placeholder. */
export function channelCardView(
  row: PublicChannelRow,
  fallbacks: { name: string; intro: string },
): ChannelCardView {
  const name = row.nickname?.trim() || fallbacks.name
  const introRaw = row.shortBio?.trim() || row.introText?.trim() || ''
  const thumb = row.featuredThumbnailUrl?.trim() ?? ''
  const avatar = row.profileImage?.trim() ?? ''
  return {
    userId: row.userId ?? '',
    name,
    intro: introRaw || fallbacks.intro,
    hasIntro: introRaw.length > 0,
    avatarUri: isRenderablePosterUri(avatar) ? avatar : null,
    initial: Array.from(name)[0]?.toUpperCase() ?? '?',
    subscribers: Number(row.subscriberCount ?? 0) || 0,
    videos: Number(row.videoCount ?? 0) || 0,
    nationality: row.nationality?.trim() || null,
    residence: row.residenceCountry?.trim() || null,
    mainField: row.mainField?.trim() || null,
    thumbUri: isRenderablePosterUri(thumb) ? thumb : null,
  }
}
