'use client'

import { Link } from '../../../i18n.config'
import Image from 'next/image'

/**
 * 채널 리스트 - 피그마 디자인 + 목업 데이터.
 * API 연동 시 mockChannels를 API 호출로 교체하면 됨.
 */
const MOCK_CHANNELS = [
  { id: '1', name: '지수 Kim', description: '안녕하세요! K-POP 지망생 지수입니다. 노래와 춤 영상을 업로드합니다 🎵', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', subscribers: 1234, videoCount: 12, totalViews: 45678 },
  { id: '2', name: '민준 Park', description: '댄스와 퍼포먼스를 사랑하는 민준입니다 💃', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', subscribers: 892, videoCount: 8, totalViews: 23456 },
  { id: '3', name: 'Sarah Lee', description: 'Vocal & Rap Artist from Seoul 🎤', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', subscribers: 2156, videoCount: 15, totalViews: 78901 },
  { id: '4', name: '현우 Choi', description: '랩과 힙합을 좋아하는 현우입니다 🎵', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', subscribers: 567, videoCount: 6, totalViews: 12345 },
  { id: '5', name: 'Emma Johnson', description: 'International dancer & choreographer 🌟', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', subscribers: 3421, videoCount: 24, totalViews: 123456 },
  { id: '6', name: '유진 Kang', description: '싱어송라이터 유진입니다. 자작곡을 공유합니다 ✨', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', subscribers: 1890, videoCount: 18, totalViews: 56789 },
  { id: '7', name: 'Alex Martinez', description: 'Professional vocalist & performer 🎶', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', subscribers: 987, videoCount: 10, totalViews: 34567 },
  { id: '8', name: '소희 Park', description: '발라드와 R&B를 부르는 소희입니다 🎵', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop', subscribers: 1456, videoCount: 14, totalViews: 45678 },
]

export default function ChannelsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          채널 리스트
        </h1>
        <p className="text-gray-600">다양한 아티스트들의 채널을 탐색하고 영상을 감상하세요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_CHANNELS.map((channel) => (
          <Link key={channel.id} href={`/channel/${channel.id}`}>
            <article className="h-full rounded-xl border-2 border-gray-100 bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:border-purple-200 hover:shadow-xl group">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-100 mb-3 group-hover:border-purple-300 transition-colors">
                  <Image src={channel.avatar} alt={channel.name} width={96} height={96} className="w-full h-full object-cover" unoptimized />
                </div>
                <h3 className="font-bold text-lg text-center group-hover:text-purple-600 transition-colors">{channel.name}</h3>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2 min-h-[40px]">{channel.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">구독자</span>
                  <span className="font-semibold text-purple-600">{channel.subscribers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">영상</span>
                  <span className="font-semibold">{channel.videoCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">조회수</span>
                  <span className="font-semibold">{channel.totalViews.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-center text-sm font-medium text-purple-600 group-hover:text-pink-600 transition-colors">
                채널 보기 →
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
