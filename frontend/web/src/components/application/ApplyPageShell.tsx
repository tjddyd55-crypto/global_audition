'use client'

import type { ReactNode } from 'react'

type ApplyPageShellProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export default function ApplyPageShell({
  children,
  className = 'min-h-screen bg-neutral-50 px-4 py-6 pb-24 md:px-8 md:py-10',
  innerClassName = 'mx-auto max-w-lg',
}: ApplyPageShellProps) {
  return (
    <div className={className}>
      <div className={innerClassName}>{children}</div>
    </div>
  )
}
