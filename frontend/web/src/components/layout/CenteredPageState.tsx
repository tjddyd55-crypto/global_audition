'use client'

import type { CSSProperties, ReactNode } from 'react'

type CenteredPageStateProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export default function CenteredPageState({ children, className, style }: CenteredPageStateProps) {
  return (
    <div
      className={className}
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
