'use client'

import type { CSSProperties, ReactNode } from 'react'

type PageSurfaceProps = {
  children: ReactNode
  background?: CSSProperties['background']
  className?: string
  style?: CSSProperties
}

export default function PageSurface({ children, background, className, style }: PageSurfaceProps) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        background,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
