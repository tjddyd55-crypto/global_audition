/** 백엔드 ChannelShownFields 와 같은 키. 채널은 이 키만 고르고 값은 프로필에서 읽는다. */
export const PROFILE_SHOWN_FIELDS = [
  'NAME',
  'NATIONALITY',
  'SHORT_BIO',
  'BIO',
  'INTRO',
  'SPECIALTIES',
  'CAREER',
  'ACTIVITY',
  'SNS',
] as const

export type ProfileShownField = (typeof PROFILE_SHOWN_FIELDS)[number]

/** 선택 저장 전 공개 읽기가 유지하는 항목. 경력·활동은 제외. */
export const LEGACY_PUBLIC_FIELDS: ProfileShownField[] = [
  'NAME',
  'NATIONALITY',
  'SHORT_BIO',
  'BIO',
  'INTRO',
  'SPECIALTIES',
  'SNS',
]

export function initialShownSelection(stored: string[] | undefined, customized: boolean): ProfileShownField[] {
  if (!customized) return [...LEGACY_PUBLIC_FIELDS]
  const allowed = new Set<string>(PROFILE_SHOWN_FIELDS)
  return (stored ?? []).filter((key): key is ProfileShownField => allowed.has(key))
}
