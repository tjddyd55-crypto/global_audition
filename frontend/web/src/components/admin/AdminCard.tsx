'use client'

import type { ReactNode } from 'react'
import { AUDITION_DETAIL, LAYOUT } from '@/shared/design-tokens'

type AdminCardProps = {
  title: string
  children: ReactNode
}

/** 슈퍼관리자 등 관리 화면용 카드 — 오디션 상세 토큰과 동일한 테두리/라운드 */
export function AdminCard({ title, children }: AdminCardProps) {
  return (
    <section
      style={{
        border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
        borderRadius: AUDITION_DETAIL.cardRadiusPx,
        padding: AUDITION_DETAIL.cardPaddingPx,
        background: '#ffffff',
        marginBottom: LAYOUT.sectionGapPx / 4,
        maxWidth: LAYOUT.containerMaxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: AUDITION_DETAIL.sectionTitlePx,
          fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          margin: '0 0 16px 0',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
