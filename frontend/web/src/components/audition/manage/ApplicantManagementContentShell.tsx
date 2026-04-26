'use client'

import type { ReactNode } from 'react'
import { PAGE_CONTAINER, SECTION_GAP } from '@/shared/ui/specClasses'

type ApplicantManagementContentShellProps = {
  children: ReactNode
}

export default function ApplicantManagementContentShell({ children }: ApplicantManagementContentShellProps) {
  return <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>{children}</div>
}
