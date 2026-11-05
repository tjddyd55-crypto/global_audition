const CATALOG_KEYS = new Set([
  'singleStageResultTitle',
  'multiStageResultTitle',
  'singleStagePassTitle',
  'singleStagePassBody',
  'singleStageFailTitle',
  'singleStageFailBody',
  'multiStagePassBody',
  'multiStageFailBody',
  'multiStageOpenBody',
  'ROUND_OPEN',
  'PASS_NOTICE',
  'FAIL_NOTICE',
  'FINAL_NOTICE',
])

const SINGLE_STAGE_TITLE_KEYS = new Set([
  'singleStageResultTitle',
  'singleStagePassTitle',
  'singleStageFailTitle',
])

export type NotificationCopySource = {
  type?: string | null
  title?: string | null
  body?: string | null
  titleKey?: string | null
  bodyKey?: string | null
  roundId?: string | null
}

/**
 * 제목은 단일 심사와 회차 심사를 나누고, 안내 문구는 기존 알림 타입을 따른다.
 * 저장된 행과 소유권은 바꾸지 않는다.
 */
export function notificationCopy(
  item: NotificationCopySource,
  translate: (key: string) => string,
): { title: string; body: string } {
  const single = isSingleStage(item)
  const title =
    translated(single ? 'singleStageResultTitle' : multiTitleKey(item.type), translate) ||
    text(item.title) ||
    translated(item.type, translate) ||
    text(item.type)
  const body =
    translated(item.bodyKey, translate) ||
    roundOpenBody(item) ||
    translated(guidanceKey(item.type, single), translate) ||
    text(item.body)
  return { title, body }
}

function isSingleStage(item: NotificationCopySource): boolean {
  if (item.titleKey && SINGLE_STAGE_TITLE_KEYS.has(item.titleKey)) return true
  if (text(item.roundId)) return false
  return item.type === 'PASS_NOTICE' || item.type === 'FAIL_NOTICE'
}

function multiTitleKey(type: string | null | undefined): string {
  if (type === 'PASS_NOTICE' || type === 'FAIL_NOTICE' || type === 'ROUND_OPEN' || type === 'FINAL_NOTICE') {
    return 'multiStageResultTitle'
  }
  return ''
}

function guidanceKey(type: string | null | undefined, single: boolean): string {
  if (single && type === 'PASS_NOTICE') return 'singleStagePassBody'
  if (single && type === 'FAIL_NOTICE') return 'singleStageFailBody'
  if (type === 'PASS_NOTICE') return 'multiStagePassBody'
  if (type === 'FAIL_NOTICE') return 'multiStageFailBody'
  if (type === 'ROUND_OPEN') return 'multiStageOpenBody'
  if (type === 'FINAL_NOTICE') return 'FINAL_NOTICE'
  return ''
}

function roundOpenBody(item: NotificationCopySource): string {
  if (item.type !== 'ROUND_OPEN') return ''
  return text(item.body)
}

function translated(key: string | null | undefined, translate: (key: string) => string): string {
  if (!key || !CATALOG_KEYS.has(key)) return ''
  return text(translate(key))
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? ''
}
