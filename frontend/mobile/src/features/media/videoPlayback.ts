import { extractYoutubeVideoId } from '../../domain/videoUrl'
import { bilibiliEmbed, bilibiliLink } from '../../../../web/src/shared/audition/bilibili'

export type VideoPlaybackPlan =
  | { kind: 'youtube'; videoId: string; embedUrl: string }
  | { kind: 'bilibili'; embedUrl: string; originalUrl: string }
  | { kind: 'unsupported' }

/** 'https://host/path' → 'https://host'. 잘못된 값이면 null. */
export function webOrigin(raw: string | null | undefined): string | null {
  const m = /^(https?:\/\/[^/?#]+)/i.exec((raw ?? '').trim())
  return m ? m[1].toLowerCase() : null
}

/**
 * 공개 영상 재생은 웹과 같이 YouTube embed만 연다.
 * TikTok·Instagram 등 외부 제공자는 재생한 것처럼 그리지 않는다.
 */
export function planVideoPlayback(
  raw: string | null | undefined,
  options?: { autoplay?: boolean; origin?: string | null },
): VideoPlaybackPlan {
  const bilibili = bilibiliLink(raw ?? '')
  if (bilibili?.kind === 'video') {
    return { kind: 'bilibili', embedUrl: bilibiliEmbed(bilibili, options?.autoplay), originalUrl: bilibili.url }
  }
  const id = extractYoutubeVideoId(raw ?? '')
  if (!id) return { kind: 'unsupported' }
  const params = new URLSearchParams({
    controls: '1',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  })
  if (options?.autoplay) params.set('autoplay', '1')
  // YouTube 는 embed 요청에 Referer(앱/사이트 식별)가 없으면 '오류 153'을 낸다.
  // origin·widget_referrer 를 웹 주소로 맞추고, 실제 Referer 는 NativeVideoPlayer 의 baseUrl 로 보낸다.
  const origin = webOrigin(options?.origin)
  if (origin) {
    params.set('origin', origin)
    params.set('widget_referrer', origin)
  }
  const safeId = encodeURIComponent(id)
  return {
    kind: 'youtube',
    videoId: id,
    // 쿠키 없는 embed 도메인. 영상은 앱 안에서만 재생하고 YouTube 로 보내지 않는다.
    embedUrl: `https://www.youtube-nocookie.com/embed/${safeId}?${params.toString()}`,
  }
}

const escapeAttr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * WebView 에 직접 embed URL 을 열면 Referer 가 비어 오류 153 이 난다.
 * 웹 주소(baseUrl)에서 연 HTML 안의 iframe 으로 열어 Referer 를 웹 origin 으로 보낸다.
 */
export function youtubeEmbedHtml(embedUrl: string, title = 'YouTube video'): string {
  return [
    '<!doctype html><html><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">',
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
    '<style>html,body{margin:0;padding:0;height:100%;background:#111;overflow:hidden}',
    'iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}</style>',
    '</head><body>',
    `<iframe src="${escapeAttr(embedUrl)}" title="${escapeAttr(title)}" `,
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" ',
    'allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>',
    '</body></html>',
  ].join('')
}


/** WebView 최상위 프레임 이동 허용 여부. 우리 웹 origin 의 HTML(about:blank 포함)만 허용하고 YouTube 등 외부는 막는다. */
export function isAllowedTopFrameUrl(url: string | null | undefined, origin: string | null): boolean {
  const u = (url ?? '').trim()
  if (!u || u === 'about:blank' || u.startsWith('data:')) return true
  if (!origin) return false
  return u === origin || u.startsWith(`${origin}/`)
}
