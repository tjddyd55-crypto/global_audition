'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '../../i18n.config'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../lib/api/auditions'
import AuditionCard from '../../components/cards/AuditionCard'
import VideoCard, { type VideoCardModel } from '../../components/cards/VideoCard'
import HeroSection from '../../components/home/HeroSection'
import { listBrowsePublicVideos, type ChannelVideoBrowseItem } from '../../lib/api/channelVideoPublic'
import { resolveVideoThumbnailUrl } from '../../lib/audition/videoThumbnail'
import { channelVideoKeys } from '../../lib/query/channelVideoQuery'
import { SkeletonAuditionCard, SkeletonVideoCard } from '../../components/ui/SkeletonCard'
import EmptyState from '../../components/ui/EmptyState'
import { LAYOUT } from '../../lib/design-tokens'

function mapBrowseItemToVideoCard(v: ChannelVideoBrowseItem): VideoCardModel {
  return {
    id: v.videoId,
    title: v.title,
    channelName: v.channelDisplayName,
    channelAvatar: v.channelProfileImageUrl ?? '',
    thumbnail: resolveVideoThumbnailUrl(v.videoUrl, v.thumbnailUrl),
    views: v.viewCount,
    likes: v.likeCount,
    category: v.category?.trim() || undefined,
  }
}

const containerStyle: React.CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

const sectionStyle: React.CSSProperties = {
  paddingTop: LAYOUT.sectionGapPx,
  paddingBottom: LAYOUT.sectionGapPx,
}

export default function HomePage() {
  const t = useTranslations('home')

  const { data: auditions, isLoading: auditionsLoading } = useQuery({
    queryKey: ['auditions'],
    queryFn: () => auditionApi.listOpen(),
    retry: 1,
  })
  const { data: browseVideos = [], isLoading: videosLoading, isError: videosError } = useQuery({
    queryKey: channelVideoKeys.browse(null),
    queryFn: () => listBrowsePublicVideos(),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  })

  const auditList = auditions ?? []
  const displayAuditions = auditList.slice(0, 3)
  const latestVideos = useMemo(() => {
    const sorted = [...browseVideos].sort(
      (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
    )
    return sorted.slice(0, 3).map(mapBrowseItemToVideoCard)
  }, [browseVideos])

  const auditionsEmpty = !auditionsLoading && displayAuditions.length === 0
  const videosEmpty = !videosLoading && !videosError && latestVideos.length === 0

  return (
    <div>
      <HeroSection
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        auditionLabel={t('viewAuditions')}
        startLabel={t('getStarted')}
      />

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>진행 중인 오디션</h2>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>지금 바로 지원 가능한 오디션을 확인하세요</p>
          </div>

          {auditionsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {[1, 2, 3].map((i) => (
                <SkeletonAuditionCard key={i} />
              ))}
            </div>
          ) : auditionsEmpty ? (
            <EmptyState message="등록된 오디션이 없습니다" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {displayAuditions.map((audition, i) => (
                <AuditionCard key={audition?.id ?? `audition-${i}`} audition={audition} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/auditions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                paddingLeft: 20,
                paddingRight: 20,
                borderRadius: 8,
                border: '1px solid #ddd',
                background: 'white',
                fontSize: 14,
                color: '#333',
                textDecoration: 'none',
              }}
            >
              모든 오디션 보기
            </Link>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={containerStyle}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>최신 영상</h2>
            <p style={{ fontSize: 14, color: '#666', margin: 0 }}>최근 업로드된 영상을 확인하세요</p>
          </div>

          {videosLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {[1, 2, 3].map((i) => (
                <SkeletonVideoCard key={i} />
              ))}
            </div>
          ) : videosError ? (
            <EmptyState message="영상 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
          ) : videosEmpty ? (
            <EmptyState message="아직 공개된 영상이 없습니다" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
              {latestVideos.map((video, i) => (
                <Link
                  key={video?.id ?? `video-${i}`}
                  href={`/videos/${video.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <VideoCard video={video} />
                </Link>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/videos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                paddingLeft: 20,
                paddingRight: 20,
                borderRadius: 8,
                border: '1px solid #ddd',
                background: 'white',
                fontSize: 14,
                color: '#333',
                textDecoration: 'none',
              }}
            >
              모든 영상 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
