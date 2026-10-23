import type { NationalityCode } from '@/shared/i18n/nationalityOptions'

const NATIONALITY_FLAGS: Record<NationalityCode, string> = {
  KR: '🇰🇷',
  MN: '🇲🇳',
  JP: '🇯🇵',
  OTHER: '',
}

export function knownNationalityCode(code: string | null | undefined): NationalityCode | null {
  const normalized = (code ?? '').trim().toUpperCase()
  if (normalized === 'KR' || normalized === 'MN' || normalized === 'JP' || normalized === 'OTHER') {
    return normalized
  }
  return null
}

export function nationalityFlag(code: NationalityCode): string {
  return NATIONALITY_FLAGS[code]
}

export function formatNationalityLabel(code: NationalityCode, label: string): string {
  const flag = nationalityFlag(code)
  return flag ? `${flag} ${label}` : label
}
