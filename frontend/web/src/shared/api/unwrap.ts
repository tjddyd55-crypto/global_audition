/**
 * 백엔드 SSOT 응답 { success, data } / { success, message } 언랩
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

/** 성공 시 data 반환. 레거시(래핑 없음)는 body 그대로 반환 */
export function unwrapData<T>(body: unknown): T {
  if (isApiSuccessEnvelope(body)) {
    return body.data as T
  }
  return body as T
}
