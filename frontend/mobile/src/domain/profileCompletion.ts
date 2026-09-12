import type { MeProfile } from '../api/types'

const TRACKED_FIELDS = ['name', 'nickname', 'birthDate', 'nationality', 'introText', 'profileImageUrl'] as const

export function profileCompletionPercent(profile: MeProfile | undefined): number {
  if (!profile) return 0
  let filled = 0
  for (const key of TRACKED_FIELDS) {
    const value = profile[key]
    if (typeof value === 'string' && value.trim().length > 0) filled += 1
  }
  if ((profile.snsLinks?.length ?? 0) > 0) filled += 1
  const total = TRACKED_FIELDS.length + 1
  return Math.round((filled / total) * 100)
}
