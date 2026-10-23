import { formatMinorGrouped } from '@/shared/money/minor'
import { formatCount } from '@/shared/money/currency'

export function adminError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data
    if (data?.message) return data.message
  }
  return '요청에 실패했습니다.'
}

export function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (!currency) return '—'
  return formatMinorGrouped(amount, currency, 'ko')
}

export function count(value: number | null | undefined): string {
  return formatCount(value ?? 0, 'ko')
}

export function envLabel(environment: string | null | undefined): string {
  if (environment === 'LIVE') return 'LIVE'
  if (environment === 'TEST') return 'TEST'
  if (environment === 'MOCK') return 'MOCK'
  return environment || '—'
}
