import type { AuditionDto } from '../api/types'

export function sortAuditionsByRecent(items: AuditionDto[]): AuditionDto[] {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function sortAuditionsByPopular(items: AuditionDto[]): AuditionDto[] {
  return [...items].sort((a, b) => b.applicantsCount - a.applicantsCount)
}
