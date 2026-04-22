'use client'

import { getDisplayNickname } from '@/shared/user/getDisplayNickname'

type UserLike = Parameters<typeof getDisplayNickname>[0]

export function UserDisplayName({ user, className }: { user: UserLike; className?: string }) {
  return <span className={className}>{getDisplayNickname(user)}</span>
}
