'use client'

import type { CSSProperties, ReactNode } from 'react'

type DetailTwoColumnGridProps = {
  children: ReactNode
  gap?: CSSProperties['gap']
  className?: string
  style?: CSSProperties
}

export default function DetailTwoColumnGrid({ children, gap, className, style }: DetailTwoColumnGridProps) {
  return (
    <div
      className={className ?? 'grid grid-cols-1 lg:grid-cols-[1fr_320px]'}
      style={{
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
