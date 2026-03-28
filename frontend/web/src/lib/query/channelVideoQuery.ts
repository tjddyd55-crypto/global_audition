import type { QueryClient } from '@tanstack/react-query'

/**
 * 영상 목록 관련 React Query 키.
 * 상위 `['channelVideos']` 무효화 시 공개/내 채널/프로필 영상 목록이 한 번에 갱신된다.
 */
export const channelVideoKeys = {
  all: ['channelVideos'] as const,
  mine: ['channelVideos', 'mine'] as const,
  mineProfile: ['channelVideos', 'mine', 'profile'] as const,
  mineMobileProfile: ['channelVideos', 'mine', 'mobileProfile'] as const,
  publicList: (userId: string) => ['channelVideos', 'public', userId] as const,
}

/**
 * 업로드·수정·삭제·공개 설정 변경 후: 영상·채널 메타·디스커버리 캐시 무효화 및 활성 목록 리패치.
 */
export async function invalidateAfterChannelVideoMutation(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: channelVideoKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['public-channel'] }),
    queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] }),
    queryClient.invalidateQueries({ queryKey: ['channels-public'] }),
  ])
  await queryClient.refetchQueries({ queryKey: channelVideoKeys.all, type: 'active' })
}
