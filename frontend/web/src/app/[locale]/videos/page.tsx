'use client'

import { useState } from 'react'
import VideoCard from '../../../components/cards/VideoCard'
import { mockVideos } from '../../../lib/mocks/videos'
import EmptyState from '../../../components/ui/EmptyState'
import { LAYOUT } from '../../../lib/design-tokens'

const CATEGORIES = ['전체 카테고리', 'Vocal', 'Dance', 'Rap']

const containerStyle: React.CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

export default function VideosPage() {
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [filterCategory, setFilterCategory] = useState<string>('전체 카테고리')

  const list = mockVideos ?? []
  const sorted = [...list].sort((a, b) =>
    sortBy === 'latest'
      ? new Date(b?.uploadedAt ?? 0).getTime() - new Date(a?.uploadedAt ?? 0).getTime()
      : (b?.views ?? 0) - (a?.views ?? 0)
  )
  const filtered =
    filterCategory === '전체 카테고리' ? sorted : sorted.filter((v) => v?.category === filterCategory)

  return (
    <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>영상 둘러보기</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>다양한 아티스트들의 최신 영상을 확인하세요</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            height: 40,
            borderRadius: 8,
            border: '1px solid #ddd',
            padding: '0 12px',
            fontSize: 14,
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
          style={{
            height: 40,
            borderRadius: 8,
            border: '1px solid #ddd',
            padding: '0 12px',
            fontSize: 14,
          }}
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="아직 업로드된 영상이 없습니다" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {filtered.map((video, i) => (
            <VideoCard key={video?.id ?? `video-${i}`} video={video} compact />
          ))}
        </div>
      )}
    </div>
  )
}
