/**
 * 백엔드 SocialVideoUrls + YoutubeUrls 허용 규칙을 클라이언트 UX용으로 미러링한다.
 * 최종 검증은 ApplicationValidationService가 SSOT다.
 */
import i18n from '../i18n'

import { extractYoutubeVideoId } from '../../../web/src/shared/audition/youtubeEmbed'
export { extractYoutubeVideoId }
export { isValidAuditionVideoLink as isValidAuditionVideoUrl } from '../../../web/src/shared/audition/videoLinks'

export function youtubeThumbnailUrl(raw: string): string | null {
  const id = extractYoutubeVideoId(raw)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

export function videoUrlHint(): string {
  return i18n.t('video.supportedLink')
}
