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
  'PENDING',
  'SENT',
  'FAILED',
])

const SINGLE_STAGE_TITLE_KEYS = new Set([
  'singleStageResultTitle',
  'singleStagePassTitle',
  'singleStageFailTitle',
])

export type NotificationCopySource = {
  type?: string | null
  /** 발송 로그 상태. 심사 결과가 아니다. 생성 시 PENDING이며 수신함 조회는 이 값을 바꾸지 않는다. */
  status?: string | null
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

/**
 * 카드 하단 배지.
 * 단일 심사 합격/불합격은 결과 라벨만 보여 준다.
 * 회차가 있는 알림은 기존처럼 타입과 발송 상태를 함께 보여 준다.
 */
export function notificationBadge(
  item: NotificationCopySource,
  translate: (key: string) => string,
): string {
  const decided = singleStageDecisionLabel(item, translate)
  if (decided) return decided
  return [notificationCodeLabel(item.type, translate), notificationCodeLabel(item.status, translate)]
    .filter((part) => part.length > 0)
    .join(' · ')
}

function singleStageDecisionLabel(
  item: NotificationCopySource,
  translate: (key: string) => string,
): string {
  if (!isSingleStage(item)) return ''
  const failed = item.bodyKey === 'singleStageFailBody' || item.titleKey === 'singleStageFailTitle' || item.type === 'FAIL_NOTICE'
  const key = failed ? 'singleStageFailTitle' : 'singleStagePassTitle'
  return translated(key, translate)
}

/** 알림 카드의 타입·전달 상태. 카탈로그에 있으면 ko/en/mn 라벨, 없으면 원문 코드. */
export function notificationCodeLabel(
  code: string | null | undefined,
  translate: (key: string) => string,
): string {
  const raw = text(code)
  if (!raw) return ''
  return translated(raw, translate) || raw
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? ''
}
