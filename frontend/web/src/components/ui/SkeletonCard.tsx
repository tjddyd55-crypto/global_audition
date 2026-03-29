'use client'

import { AUDITION_CARD } from '../../lib/design-tokens'

/** 오디션 목록 행 스켈레톤(카드·테두리 없음; 썸네일은 고정 비율 없음) */
export function SkeletonAuditionCard() {
  return (
    <div className="w-full animate-pulse">
      <div className="w-full bg-neutral-200 py-28" />
      <div className="space-y-2 px-4 py-3">
        <div className="h-4 w-4/5 rounded bg-neutral-200" />
        <div className="h-3 w-3/5 rounded bg-neutral-100" />
      </div>
    </div>
  )
}

/** 유튜브형 영상 행 스켈레톤(카드·테두리 없음) */
export function SkeletonVideoListItem() {
  return (
    <div className="w-full animate-pulse">
      <div className="aspect-video w-full bg-neutral-200" />
      <div className="flex gap-3 px-4 py-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-3 w-2/3 rounded bg-neutral-100" />
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-100" />
      </div>
    </div>
  )
}

export function SkeletonVideoCard() {
  return <SkeletonVideoListItem />
}

export function SkeletonChannelCard() {
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${AUDITION_CARD.borderColor}`,
        borderRadius: AUDITION_CARD.borderRadiusPx,
        padding: 24,
        textAlign: 'center',
        height: '100%',
      }}
      className="animate-pulse"
    >
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 12px' }} />
      <div style={{ height: 18, width: 100, background: '#e5e7eb', borderRadius: 4, margin: '0 auto 8px' }} />
      <div style={{ height: 32, background: '#f3f4f6', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 14, width: 80, background: '#f3f4f6', borderRadius: 4, margin: '0 auto' }} />
    </div>
  )
}
