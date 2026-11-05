const CATALOG_KEYS = new Set([
  'singleStagePassTitle',
  'singleStagePassBody',
  'singleStageFailTitle',
  'singleStageFailBody',
  'ROUND_OPEN',
  'PASS_NOTICE',
  'FAIL_NOTICE',
  'FINAL_NOTICE',
])

export type NotificationCopySource = {
  type?: string | null
  title?: string | null
  body?: string | null
  titleKey?: string | null
  bodyKey?: string | null
}

/**
 * 알림 문구. titleKey/bodyKey 가 있으면 notifications 카탈로그를 쓴다.
 * 없으면 서버가 넣어 둔 title/body 를 그대로 보여 기존 라운드 알림을 유지한다.
 */
export function notificationCopy(
  item: NotificationCopySource,
  translate: (key: string) => string,
): { title: string; body: string } {
  const title =
    translated(item.titleKey, translate) ||
    text(item.title) ||
    translated(item.type, translate) ||
    text(item.type)
  const body = translated(item.bodyKey, translate) || text(item.body)
  return { title, body }
}

function translated(key: string | null | undefined, translate: (key: string) => string): string {
  if (!key || !CATALOG_KEYS.has(key)) return ''
  const value = translate(key)
  return text(value)
}

function text(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed
}
