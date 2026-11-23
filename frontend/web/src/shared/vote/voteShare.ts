/**
 * 후보별 공개 투표 공유 링크.
 * 링크는 오디션 + 회차 + 공개 후보(지원) ID 로 고정한다. 개인정보·토큰은 넣지 않는다.
 * 언어만 바꿔도 같은 후보·회차를 가리키도록 locale 은 경로 앞에만 붙인다.
 */
export function voteSharePath(auditionId: string, round: number, applicationId: string): string {
  const q = new URLSearchParams({ round: String(round), candidate: applicationId })
  return `/auditions/${encodeURIComponent(auditionId)}/vote?${q.toString()}`
}

export function voteShareUrl(origin: string, locale: string, auditionId: string, round: number, applicationId: string): string {
  return `${origin.replace(/\/+$/, '')}/${locale}${voteSharePath(auditionId, round, applicationId)}`
}

/** Facebook 공식 공유(sharer) 주소. 게시는 사용자가 Facebook 화면에서 직접 한다. */
export function facebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

/** Instagram 공식 웹 링크 공유 주소는 없다. 웹은 이 주소로 열고, 앱은 instagram:// 를 먼저 시도한다. */
export const INSTAGRAM_WEB_URL = 'https://www.instagram.com/'
export const INSTAGRAM_APP_URLS = ['instagram://app', 'instagram://'] as const

export function shareMessage(text: string, url: string): string {
  const body = text.trim()
  return body ? `${body}\n${url}` : url
}

/** 링크의 round/candidate 파라미터 읽기(잘못된 값은 버린다). */
export function parseShareParams(round: unknown, candidate: unknown): { round: number | null; candidate: string | null } {
  const r = Number(Array.isArray(round) ? round[0] : round)
  const c = String((Array.isArray(candidate) ? candidate[0] : candidate) ?? '').trim()
  return {
    round: Number.isInteger(r) && r > 0 && r < 1000 ? r : null,
    candidate: /^[0-9a-fA-F-]{36}$/.test(c) ? c.toLowerCase() : null,
  }
}
