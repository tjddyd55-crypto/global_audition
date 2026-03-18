'use client'

import { useState } from 'react'
import { Link } from '../../../i18n.config'
import Image from 'next/image'

/**
 * 영상 둘러보기 - 피그마 디자인 + 목업 데이터.
 * API 연동 시 mockVideos를 API 호출로 교체하면 됨.
 */
const MOCK_VIDEOS = [
  { id: '1', title: 'Vocal Performance - "Rise Up"', description: '나의 첫 보컬 퍼포먼스 영상입니다.', category: 'Vocal', views: 15234, likes: 892, thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop', uploadedAt: '2026-03-18', channelId: '1', channelName: '지수 Kim', channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { id: '2', title: 'Dance Cover - New Jeans "OMG"', description: '뉴진스 OMG 커버 댄스입니다', category: 'Dance', views: 23456, likes: 1234, thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=300&fit=crop', uploadedAt: '2026-03-17', channelId: '1', channelName: '지수 Kim', channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { id: '3', title: 'Freestyle Dance Performance', description: '최신 힙합 트랙에 맞춘 프리스타일 댄스', category: 'Dance', views: 18901, likes: 1045, thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc9498cfd8?w=400&h=300&fit=crop', uploadedAt: '2026-03-17', channelId: '2', channelName: '민준 Park', channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  { id: '4', title: 'Original Song - "Dreams Come True"', description: '제가 작곡한 자작곡입니다.', category: 'Vocal', views: 34567, likes: 2345, thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', uploadedAt: '2026-03-16', channelId: '3', channelName: 'Sarah Lee', channelAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  { id: '5', title: 'Rap Performance - Original Lyrics', description: '자작 가사로 만든 랩 퍼포먼스', category: 'Rap', views: 12345, likes: 678, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop', uploadedAt: '2026-03-16', channelId: '4', channelName: '현우 Choi', channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { id: '6', title: 'Contemporary Dance Solo', description: 'Emotional contemporary dance piece', category: 'Dance', views: 45678, likes: 3456, thumbnail: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=300&fit=crop', uploadedAt: '2026-03-15', channelId: '5', channelName: 'Emma Johnson', channelAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop' },
  { id: '7', title: 'Acoustic Session - "Stay"', description: '어쿠스틱 기타와 함께하는 보컬 세션', category: 'Vocal', views: 23456, likes: 1567, thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop', uploadedAt: '2026-03-15', channelId: '6', channelName: '유진 Kang', channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop' },
  { id: '8', title: 'Ballad Cover - "Through the Night"', description: '아이유 "밤편지" 커버', category: 'Vocal', views: 28901, likes: 1890, thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop', uploadedAt: '2026-03-14', channelId: '8', channelName: '소희 Park', channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop' },
]

const CATEGORIES = ['전체 카테고리', 'Vocal', 'Dance', 'Rap']

export default function VideosPage() {
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [filterCategory, setFilterCategory] = useState<string>('전체 카테고리')

  const sorted = [...MOCK_VIDEOS].sort((a, b) =>
    sortBy === 'latest' ? new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime() : b.views - a.views
  )
  const filtered = filterCategory === '전체 카테고리' ? sorted : sorted.filter((v) => v.category === filterCategory)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          영상 둘러보기
        </h1>
        <p className="text-gray-600">다양한 아티스트들의 최신 영상을 확인하세요</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
          className="min-w-[200px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((video) => (
          <div key={video.id} className="group">
            <article className="h-full rounded-xl border-2 border-gray-100 bg-white overflow-hidden shadow-sm transition-all hover:border-purple-200 hover:shadow-xl flex flex-col">
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                <Image src={video.thumbnail} alt={video.title} width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" unoptimized />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <Link href={`/channel/${video.channelId}`} className="flex items-center gap-2 mb-2 hover:opacity-75">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-100 flex-shrink-0">
                    <Image src={video.channelAvatar} alt={video.channelName} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{video.channelName}</span>
                </Link>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{video.title}</h3>
                <span className="inline-flex w-fit rounded border px-2 py-0.5 text-xs font-medium mb-2">{video.category}</span>
                {video.description && <p className="text-xs text-gray-600 line-clamp-2 mb-2">{video.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                  <span>{video.views.toLocaleString()}회</span>
                  <span>❤ {video.likes.toLocaleString()}</span>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  )
}
