export interface MockVideo {
  id: string
  title: string
  description: string
  category: 'Vocal' | 'Dance' | 'Rap'
  views: number
  likes: number
  thumbnail: string | null
  uploadedAt: string
  channelId: string
  channelName: string
  channelAvatar: string
}

export const mockVideos: MockVideo[] = [
  {
    id: '1',
    title: 'Vocal Performance - "Rise Up"',
    description: '나의 첫 보컬 퍼포먼스 영상입니다. 많은 응원 부탁드립니다!',
    category: 'Vocal',
    views: 15234,
    likes: 892,
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-18',
    channelId: '1',
    channelName: '지수 Kim',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'Dance Cover - New Jeans "OMG"',
    description: '뉴진스 OMG 커버 댄스입니다',
    category: 'Dance',
    views: 23456,
    likes: 1234,
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-17',
    channelId: '1',
    channelName: '지수 Kim',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'Freestyle Dance Performance',
    description: '최신 힙합 트랙에 맞춘 프리스타일 댄스',
    category: 'Dance',
    views: 18901,
    likes: 1045,
    thumbnail: null,
    uploadedAt: '2026-03-17',
    channelId: '2',
    channelName: '민준 Park',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
  {
    id: '4',
    title: 'Original Song - "Dreams Come True"',
    description: '제가 작곡한 자작곡입니다. 많은 사랑 부탁드려요!',
    category: 'Vocal',
    views: 34567,
    likes: 2345,
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-16',
    channelId: '3',
    channelName: 'Sarah Lee',
    channelAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  },
  {
    id: '5',
    title: 'Rap Performance - Original Lyrics',
    description: '자작 가사로 만든 랩 퍼포먼스',
    category: 'Rap',
    views: 12345,
    likes: 678,
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-16',
    channelId: '4',
    channelName: '현우 Choi',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  },
  {
    id: '6',
    title: 'Contemporary Dance Solo',
    description: 'Emotional contemporary dance piece',
    category: 'Dance',
    views: 45678,
    likes: 3456,
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-15',
    channelId: '5',
    channelName: 'Emma Johnson',
    channelAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  },
  {
    id: '7',
    title: 'Acoustic Session - "Stay"',
    description: '어쿠스틱 기타와 함께하는 보컬 세션',
    category: 'Vocal',
    views: 23456,
    likes: 1567,
    thumbnail: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-15',
    channelId: '6',
    channelName: '유진 Kang',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  },
  {
    id: '8',
    title: 'Ballad Cover - "Through the Night"',
    description: '아이유 "밤편지" 커버',
    category: 'Vocal',
    views: 28901,
    likes: 1890,
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    uploadedAt: '2026-03-14',
    channelId: '8',
    channelName: '소희 Park',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop',
  },
]
