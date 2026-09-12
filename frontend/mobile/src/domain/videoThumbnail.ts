import { youtubeThumbnailUrl } from './videoUrl'

export function resolveVideoThumbnailUrl(videoUrl: string, storedThumbnail?: string | null): string | null {
  const stored = storedThumbnail?.trim()
  if (stored && !stored.includes('youtube.com/watch') && !stored.includes('youtu.be/')) {
    return stored
  }
  if (stored) {
    const fromStored = youtubeThumbnailUrl(stored)
    if (fromStored) return fromStored
  }
  return youtubeThumbnailUrl(videoUrl)
}
