/**
 * 백엔드 ApiEnvelope { success, data } 언랩.
 * 웹 `frontend/web/src/shared/api/unwrap.ts` 와 동일 계약.
 */

export function isApiSuccessEnvelope(body: unknown): body is { success: true; data: unknown } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    (body as { success: unknown }).success === true &&
    'data' in body
  )
}

export function isApiFailEnvelope(body: unknown): body is { success: false; message?: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    (body as { success: unknown }).success === false
  )
}

export function unwrapData<T>(body: unknown): T {
  if (isApiSuccessEnvelope(body)) {
    return body.data as T
  }
  return body as T
}

export function readApiErrorMessage(body: unknown, fallback: string): string {
  if (isApiFailEnvelope(body) && body.message) return body.message
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}
