import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { parseEntryNumber } from '@/shared/audition/entryNumbers'
import { parseShareParams } from '@/shared/vote/voteShare'
import { AuditionPublicVoteClient } from './VotePageClient'

type PageProps = {
  params: { locale: string; id: string } | Promise<{ locale: string; id: string }>
  searchParams: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}

const DEFAULT_OG_IMAGE = '/og/global-audition-vote.png'

type ShareVotePayload = {
  roundNumber?: number
  audition?: { title?: string }
  sharedCandidate?: { candidateNumber?: number; userName?: string; description?: string; videoUrl?: string; thumbnailUrl?: string } | null
}

function requestOrigin(): string {
  const h = headers()
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim()
  const proto = (h.get('x-forwarded-proto') || 'https').split(',')[0].trim()
  return host ? `${proto}://${host}` : ''
}

function youtubeThumb(url?: string): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/)
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null
}

async function loadShareData(auditionId: string, round: number | null, candidate: string | null, origin: string) {
  const base = (process.env.BACKEND_PROXY_ORIGIN || origin).replace(/\/+$/, '')
  if (!base) return null
  const q = new URLSearchParams()
  if (round) q.set('round', String(round))
  if (candidate) q.set('candidate', candidate)
  try {
    // 비로그인 공개 조회(토큰 없음). 미리보기 크롤러도 같은 내용을 받는다.
    const res = await fetch(`${base}/api/auditions/${encodeURIComponent(auditionId)}/votes?${q.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: ShareVotePayload } & ShareVotePayload
    return (json.data ?? json) as ShareVotePayload
  } catch {
    return null
  }
}

/** 공고 제목은 기존 자동 번역을 그대로 쓴다(locale 별 표시 제목). */
async function loadLocalizedTitle(auditionId: string, locale: string, origin: string): Promise<string | null> {
  const base = (process.env.BACKEND_PROXY_ORIGIN || origin).replace(/\/+$/, '')
  if (!base) return null
  try {
    const res = await fetch(`${base}/api/auditions/${encodeURIComponent(auditionId)}?locale=${encodeURIComponent(locale)}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: Record<string, unknown> } & Record<string, unknown>
    const d = (json.data ?? json) as Record<string, unknown>
    const title = String(d.displayTitle ?? d.title ?? '').trim()
    return title || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, id } = await params
  const sp = await searchParams
  const { round, candidate } = parseShareParams(sp.round, sp.candidate)
  const t = await getTranslations({ locale, namespace: 'voteShare' })
  const origin = requestOrigin()
  const [data, localizedTitle] = await Promise.all([
    loadShareData(id, round, candidate, origin),
    loadLocalizedTitle(id, locale, origin),
  ])
  const auditionTitle = localizedTitle || data?.audition?.title?.trim() || 'GLOBAL AUDITION'
  const linkRound = data?.roundNumber ?? round ?? 1
  const shared = data?.sharedCandidate ?? null
  const name = shared?.userName?.trim() || ''

  const candidateNumber = parseEntryNumber(shared?.candidateNumber)
  const title = shared && name ? candidateNumber ? t('numberedShareTitle', { name, number: candidateNumber }) : t('ogTitle', { name }) : t('ogDefaultTitle', { audition: auditionTitle })
  const description =
    shared && name
      ? t('ogDescription', { audition: auditionTitle, round: linkRound, name })
      : t('ogDefaultDescription')
  const image = (shared && (shared.thumbnailUrl?.trim() || youtubeThumb(shared.videoUrl))) || DEFAULT_OG_IMAGE

  const q = new URLSearchParams()
  if (round || (shared && linkRound)) q.set('round', String(round ?? linkRound))
  if (shared && candidate) q.set('candidate', candidate)
  const path = `/${locale}/auditions/${id}/vote${q.toString() ? `?${q.toString()}` : ''}`

  return {
    metadataBase: origin ? new URL(origin) : undefined,
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'GLOBAL AUDITION',
      title,
      description,
      url: path,
      locale,
      // 기본 이미지만 크기를 안다. 후보 썸네일(YouTube 등)은 크기를 적지 않는다.
      images: [image === DEFAULT_OG_IMAGE ? { url: image, width: 1200, height: 630, alt: title } : { url: image, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function AuditionPublicVotePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { round, candidate } = parseShareParams(sp.round, sp.candidate)
  return <AuditionPublicVoteClient shareRound={round} shareCandidate={candidate} />
}
