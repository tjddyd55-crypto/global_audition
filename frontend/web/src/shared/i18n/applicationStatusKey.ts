export type ApplicationStatusMessageKey = 'underReview' | 'accepted' | 'rejected' | 'submitted'

export function applicationStatusMessageKey(status?: string | null): ApplicationStatusMessageKey | null {
  if (status === 'REVIEWING' || status === 'REVIEWED') return 'underReview'
  if (status === 'ACCEPTED') return 'accepted'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'SUBMITTED') return 'submitted'
  return null
}
