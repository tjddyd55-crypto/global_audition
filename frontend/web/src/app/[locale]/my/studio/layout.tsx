'use client'

import type { ReactNode } from 'react'
import { StudioFrame } from '@/components/studio/StudioFrame'

export default function MyStudioLayout({ children }: { children: ReactNode }) {
  return <StudioFrame>{children}</StudioFrame>
}
