import { extractYoutubeVideoId, isValidAuditionVideoUrl } from './videoUrl'

describe('videoUrl — SocialVideoUrls / YoutubeUrls 미러', () => {
  it('YouTube watch·short·shorts를 허용한다', () => {
    expect(isValidAuditionVideoUrl('https://www.youtube.com/watch?v=abcdefghijk')).toBe(true)
    expect(isValidAuditionVideoUrl('https://youtu.be/abcdefghijk')).toBe(true)
    expect(isValidAuditionVideoUrl('https://youtube.com/shorts/abcdefghijk')).toBe(true)
    expect(extractYoutubeVideoId('https://youtu.be/abcdefghijk')).toBe('abcdefghijk')
  })

  it('TikTok·Instagram 경로를 허용한다', () => {
    expect(isValidAuditionVideoUrl('https://www.tiktok.com/@user/video/123')).toBe(true)
    expect(isValidAuditionVideoUrl('https://www.instagram.com/reel/AbC123/')).toBe(true)
  })

  it('빈 값과 비허용 호스트는 거절한다', () => {
    expect(isValidAuditionVideoUrl('')).toBe(false)
    expect(isValidAuditionVideoUrl('https://vimeo.com/123')).toBe(false)
    expect(isValidAuditionVideoUrl('https://instagram.com/user')).toBe(false)
  })
})
