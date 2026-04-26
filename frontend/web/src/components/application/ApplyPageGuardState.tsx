'use client'

import { Link } from '@/i18n.config'
import CenteredPageState from '@/components/layout/CenteredPageState'

type ApplyPageGuardStateProps = {
  message: string
  href: string
  linkLabel: string
  messageClassName?: string
  className?: string
}

export default function ApplyPageGuardState({
  message,
  href,
  linkLabel,
  messageClassName = 'mb-4 text-neutral-800',
  className = 'flex min-h-screen flex-col items-center justify-center p-4 text-center',
}: ApplyPageGuardStateProps) {
  return (
    <CenteredPageState className={className}>
      <p className={messageClassName}>{message}</p>
      <Link href={href} className="text-violet-600 hover:underline">
        {linkLabel}
      </Link>
    </CenteredPageState>
  )
}
