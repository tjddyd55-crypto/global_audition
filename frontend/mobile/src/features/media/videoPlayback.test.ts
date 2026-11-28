import { isAllowedTopFrameUrl, planVideoPlayback, webOrigin, youtubeEmbedHtml } from './videoPlayback'

describe('native video playback', () => {
  it('builds a real YouTube embed for watch, share, and shorts URLs', () => {
    const watch = planVideoPlayback('https://www.youtube.com/watch?v=aqz-KE-bpKQ')
    const share = planVideoPlayback('https://youtu.be/aqz-KE-bpKQ')
    const shorts = planVideoPlayback('https://www.youtube.com/shorts/aqz-KE-bpKQ')
    expect(watch).toEqual(share)
    expect(watch.kind).toBe('youtube')
    if (watch.kind === 'youtube') {
      expect(watch.embedUrl).toContain('https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ')
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

  it('uses the Bilibili player and keeps the selected part', () => {
    const plan = planVideoPlayback('https://m.bilibili.com/video/BV1B7411m7LV?p=2&share=1')
    expect(plan).toEqual({
      kind: 'bilibili',
      embedUrl: 'https://player.bilibili.com/player.html?bvid=BV1B7411m7LV&p=2&autoplay=0&danmaku=0',
      originalUrl: 'https://www.bilibili.com/video/BV1B7411m7LV?p=2',
    })
    expect(planVideoPlayback('https://b23.tv/Example')).toEqual({ kind: 'unsupported' })
    expect(planVideoPlayback('https://www.bilibili.com.example.com/video/BV1B7411m7LV')).toEqual({ kind: 'unsupported' })
  })
})

describe('planVideoPlayback autoplay', () => {
  it('adds autoplay only when the viewer tapped play', () => {
    const tapped = planVideoPlayback('https://youtube.com/shorts/aqz-KE-bpKQ', { autoplay: true })
    expect(tapped.kind === 'youtube' && tapped.embedUrl).toContain('autoplay=1')
    const idle = planVideoPlayback('https://youtu.be/aqz-KE-bpKQ')
    expect(idle.kind === 'youtube' && idle.embedUrl).not.toContain('autoplay')
  })
})

describe('YouTube error 153 (missing referrer) guard', () => {
  it('sends the web origin as origin/widget_referrer and keeps a watch URL fallback', () => {
    const plan = planVideoPlayback('https://youtu.be/aqz-KE-bpKQ', { origin: 'https://frontend-develop-3d3e.up.railway.app/api' })
    expect(plan.kind).toBe('youtube')
    if (plan.kind !== 'youtube') return
    const u = new URL(plan.embedUrl)
    expect(u.origin + u.pathname).toBe('https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ')
    expect(u.searchParams.get('rel')).toBe('0')
    expect(u.searchParams.get('origin')).toBe('https://frontend-develop-3d3e.up.railway.app')
    expect(u.searchParams.get('widget_referrer')).toBe('https://frontend-develop-3d3e.up.railway.app')
    expect(u.searchParams.get('playsinline')).toBe('1')
  })

  it('wraps the embed in an iframe with a referrer policy instead of loading it top-level', () => {
    const html = youtubeEmbedHtml('https://www.youtube.com/embed/aqz-KE-bpKQ?a=1&b=2', 'Play "x"')
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/aqz-KE-bpKQ?a=1&amp;b=2"')
    expect(html).toContain('referrerpolicy="strict-origin-when-cross-origin"')
    expect(html).toContain('<meta name="referrer" content="strict-origin-when-cross-origin">')
    expect(html).toContain('allowfullscreen')
    expect(html).toContain('title="Play &quot;x&quot;"')
  })

  it('webOrigin strips path and rejects junk', () => {
    expect(webOrigin('https://Frontend-Develop-3d3e.up.railway.app/ko/x')).toBe('https://frontend-develop-3d3e.up.railway.app')
    expect(webOrigin('')).toBeNull()
    expect(webOrigin('javascript:alert(1)')).toBeNull()
  })
})

describe('native player never leaves the app for YouTube', () => {
  const origin = 'https://frontend-develop-3d3e.up.railway.app'
  it('allows only our own base page as the top frame', () => {
    expect(isAllowedTopFrameUrl(`${origin}/`, origin)).toBe(true)
    expect(isAllowedTopFrameUrl('about:blank', origin)).toBe(true)
    expect(isAllowedTopFrameUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ', origin)).toBe(false)
    expect(isAllowedTopFrameUrl('https://youtu.be/aqz-KE-bpKQ', origin)).toBe(false)
    expect(isAllowedTopFrameUrl('https://m.youtube.com/', origin)).toBe(false)
    expect(isAllowedTopFrameUrl('https://frontend-develop-3d3e.up.railway.app.evil.com/', origin)).toBe(false)
  })
})
