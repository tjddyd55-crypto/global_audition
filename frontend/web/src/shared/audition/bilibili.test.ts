import { bilibiliEmbed, bilibiliLink } from './bilibili'
import { isValidAuditionVideoLink } from './videoLinks'
import { getVideoEmbedSrc } from '../utils/videoEmbed'

const official = 'https://www.bilibili.com/video/BV1B7411m7LV'

describe('video provider selection', () => {
  it('supports copied Bilibili mobile and desktop links, AID, and multi-part videos', () => {
    expect(bilibiliLink('Watch https://m.bilibili.com/video/BV1B7411m7LV?p=2&share=1')).toEqual({
      kind: 'video', id: 'BV1B7411m7LV', page: 2, url: official + '?p=2',
    })
    const aid = bilibiliLink('https://bilibili.com/video/av12345')
    expect(aid?.kind === 'video' && bilibiliEmbed(aid)).toBe(
      'https://player.bilibili.com/player.html?aid=12345&p=1&autoplay=0&danmaku=0',
    )
    expect(getVideoEmbedSrc(official + '?p=2', { autoplay: true })).toContain('bvid=BV1B7411m7LV&p=2&autoplay=1')
  })

  it('requires server resolution for Bilibili short links', () => {
    expect(bilibiliLink('https://b23.tv/Z123')).toEqual({ kind: 'short', url: 'https://b23.tv/Z123' })
    expect(getVideoEmbedSrc('https://b23.tv/Z123')).toBeNull()
  })

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
  ])('keeps the existing YouTube player for %s', (url) => {
    expect(getVideoEmbedSrc(url)).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it.each(['https://vm.tiktok.com/Z123/', 'https://www.instagram.com/reel/ABC/'])(
    'continues to accept %s for applications', (url) => {
      expect(isValidAuditionVideoLink(url)).toBe(true)
      expect(getVideoEmbedSrc(url)).toBeNull()
    },
  )

  it.each([
    'https://wrong.test/youtube.com/watch?v=dQw4w9WgXcQ',
    'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
    'https://www.bilibili.com:443/video/BV1B7411m7LV',
    'https://www.bilibili.com@wrong.test/video/BV1B7411m7LV',
    'https://www.bilibili.com.wrong.test/video/BV1B7411m7LV',
    'https://www.bilibili.com/video/BV1B7411m7LV?p=2&p=3',
    'https://www.bilibili.com/video/BVbad',
    'https://www.bilibili.com/search',
    'http://b23.tv/Z123',
    '<iframe src="https://www.bilibili.com/video/BV1B7411m7LV"></iframe>',
    'javascript:alert(1)',
    'file:///video.mp4',
  ])('rejects %s', (url) => {
    expect(isValidAuditionVideoLink(url)).toBe(false)
    expect(getVideoEmbedSrc(url)).toBeNull()
  })
})
