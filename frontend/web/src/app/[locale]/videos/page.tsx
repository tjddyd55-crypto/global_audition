'use client'

import { useState } from 'react'
import VideoCard from '../../../components/cards/VideoCard'
import { mockVideos } from '../../../lib/mocks/videos'

const CATEGORIES = ['전체 카테고리', 'Vocal', 'Dance', 'Rap']

export default function VideosPage() {
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [filterCategory, setFilterCategory] = useState<string>('전체 카테고리')

  const sorted = [...mockVideos].sort((a, b) =>
    sortBy === 'latest' ? new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime() : b.views - a.views
  )
  const filtered = filterCategory === '전체 카테고리' ? sorted : sorted.filter((v) => v.category === filterCategory)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
      <div className="mb-7">
        <h1 className="mb-2 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          영상 둘러보기
        </h1>
        <p className="text-lg text-gray-600">다양한 아티스트들의 최신 영상을 확인하세요</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-11 rounded-md border border-gray-300 bg-gray-50 px-3 text-sm"
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
          className="h-11 rounded-md border border-gray-300 bg-gray-50 px-3 text-sm"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((video) => (
          <VideoCard key={video.id} video={video} compact />
        ))}
      </div>
    </div>
  )
}
