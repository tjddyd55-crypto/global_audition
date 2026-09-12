'use client'

import { Link } from '../../i18n.config'
import { VideoListItem } from '../video/VideoListItem'
import { SkeletonVideoCard } from '../ui/SkeletonCard'
import EmptyState from '../ui/EmptyState'
import { LAYOUT } from '@/shared/design-tokens'
import { formatRelative } from '@/shared/i18n/formatRelative'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { useTranslations } from 'next-intl'
import type { ChannelVideoBrowseItem } from '@/shared/api/channelVideoPublic'

const sectionStyle: React.CSSProperties = {
  paddingTop: LAYOUT.sectionGapPx,
  paddingBottom: LAYOUT.sectionGapPx,
}

type HomeVideoSectionProps = {
  videos: ChannelVideoBrowseItem[]
  isLoading: boolean
  isError: boolean
}

export default function HomeVideoSection({ videos, isLoading, isError }: HomeVideoSectionProps) {
  const t = useTranslations('home')
  const tChannel = useTranslations('channel')
  const tRelative = useTranslations('relative')
  const isEmpty = !isLoading && !isError && videos.length === 0

  return (
    <section style={sectionStyle}>
      <div className="w-full">
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>{t('latestVideos')}</h2>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{t('latestVideosHint')}</p>
        </div>

        {isLoading ? (
          <div className="w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className={i > 1 ? 'mt-4' : ''}>
                <SkeletonVideoCard />
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState message={t('videosLoadFailed')} />
        ) : isEmpty ? (
          <EmptyState message={tChannel('emptyVideos')} />
        ) : (
          <div className="w-full">
            {videos.map((v, i) => (
              <div key={v.videoId} className={i > 0 ? 'mt-4' : ''}>
                <VideoListItem
                  href={`/videos/${v.videoId}`}
                  title={v.title}
                  thumbnailSrc={resolveVideoThumbnailUrl(v.videoUrl, v.thumbnailUrl)}
                  channelName={v.channelDisplayName || tChannel('title')}
                  channelImageSrc={v.channelProfileImageUrl}
                  viewCount={Number(v.viewCount ?? 0)}
                  dateLabel={formatRelative(v.publishedAt ?? '', tRelative)}
                  categoryBadge={v.category?.trim() || null}
                />
              </div>
            ))}
          </div>
        )}

        <div className="px-4 text-center" style={{ marginTop: 24 }}>
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
            {t('seeAllVideos')}
          </Link>
        </div>
      </div>
    </section>
  )
}
