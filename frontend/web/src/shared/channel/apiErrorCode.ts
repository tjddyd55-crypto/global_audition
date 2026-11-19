import axios from 'axios'

/** 백엔드 ResponseStatusException reason(예: CHANNEL_VIDEO_DUPLICATE)을 꺼낸다. 원문 문장은 화면에 쓰지 않는다. */
export function apiErrorCode(error: unknown): string {
  if (!axios.isAxiosError(error)) return ''
  const body = error.response?.data as { code?: unknown; message?: unknown; error?: unknown } | undefined
  for (const v of [body?.code, body?.message, body?.error]) {
    if (typeof v === 'string' && /^[A-Z][A-Z0-9_]+$/.test(v.trim())) return v.trim()
  }
  return ''
}
