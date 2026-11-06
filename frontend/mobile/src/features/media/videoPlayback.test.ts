import { planVideoPlayback } from './videoPlayback'

describe('native video playback', () => {
  it('builds a real YouTube embed for watch, share, and shorts URLs', () => {
    const watch = planVideoPlayback('https://www.youtube.com/watch?v=aqz-KE-bpKQ')
    const share = planVideoPlayback('https://youtu.be/aqz-KE-bpKQ')
    const shorts = planVideoPlayback('https://www.youtube.com/shorts/aqz-KE-bpKQ')
    expect(watch).toEqual(share)
    expect(watch.kind).toBe('youtube')
    if (watch.kind === 'youtube') {
      expect(watch.embedUrl).toContain('https://www.youtube.com/embed/aqz-KE-bpKQ')
      expect(watch.embedUrl).toContain('controls=1')
      expect(watch.embedUrl).not.toContain('watch?v=')
    }
    expect(shorts.kind).toBe('youtube')
  })

  it('does not pretend TikTok, Instagram, or an empty URL can play inside the app', () => {
    expect(planVideoPlayback('https://www.tiktok.com/@studio/video/1').kind).toBe('unsupported')
    expect(planVideoPlayback('https://www.instagram.com/reel/abc/').kind).toBe('unsupported')
    expect(planVideoPlayback('https://example.com/clip.mp4').kind).toBe('unsupported')
    expect(planVideoPlayback('').kind).toBe('unsupported')
    expect(planVideoPlayback(null).kind).toBe('unsupported')
  })
})
