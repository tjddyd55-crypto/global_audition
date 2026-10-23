'use client'

import { useTranslations } from 'next-intl'
import { getDisplayNickname } from '@/shared/user/getDisplayNickname'

type UserLike = Parameters<typeof getDisplayNickname>[0]

export function UserDisplayName({ user, className }: { user: UserLike; className?: string }) {
  const tFallback = useTranslations('fallback')
  return <span className={className}>{getDisplayNickname(user, tFallback('userName'))}</span>
}
