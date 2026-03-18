export interface MockChannel {
  id: string
  name: string
  description: string
  avatar: string
  subscribers: number
  videoCount: number
  totalViews: number
}

export const mockChannels: MockChannel[] = [
  {
    id: '1',
    name: '지수 Kim',
    description: '안녕하세요! K-POP 지망생 지수입니다. 노래와 춤 영상을 업로드합니다 🎵',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    subscribers: 1234,
    videoCount: 12,
    totalViews: 45678,
  },
  {
    id: '2',
    name: '민준 Park',
    description: '댄스와 퍼포먼스를 사랑하는 민준입니다 💃',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    subscribers: 892,
    videoCount: 8,
    totalViews: 23456,
  },
  {
    id: '3',
    name: 'Sarah Lee',
    description: 'Vocal & Rap Artist from Seoul',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    subscribers: 2156,
    videoCount: 15,
    totalViews: 78901,
  },
  {
    id: '4',
    name: '현우 Choi',
    description: '랩과 힙합을 좋아하는 현우입니다 🎵',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    subscribers: 567,
    videoCount: 6,
    totalViews: 12345,
  },
  {
    id: '5',
    name: 'Emma Johnson',
    description: 'International dancer & choreographer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    subscribers: 3421,
    videoCount: 24,
    totalViews: 123456,
  },
  {
    id: '6',
    name: '유진 Kang',
    description: '싱어송라이터 유진입니다. 자작곡을 공유합니다',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    subscribers: 1890,
    videoCount: 18,
    totalViews: 56789,
  },
  {
    id: '7',
    name: 'Alex Martinez',
    description: 'Professional vocalist & performer',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    subscribers: 987,
    videoCount: 10,
    totalViews: 34567,
  },
  {
    id: '8',
    name: '소희 Park',
    description: '발라드와 R&B를 부르는 소희입니다 🎵',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop',
    subscribers: 1456,
    videoCount: 14,
    totalViews: 45678,
  },
]
