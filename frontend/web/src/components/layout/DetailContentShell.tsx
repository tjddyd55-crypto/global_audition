'use client'

import type { CSSProperties, ReactNode } from 'react'

type DetailContentShellProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export default function DetailContentShell({ children, className, style }: DetailContentShellProps) {
  return (
    <div
      className={className ?? 'w-full px-4 pb-[calc(120px+env(safe-area-inset-bottom))]'}
      style={style}
    >
      {children}
    </div>
  )
}
