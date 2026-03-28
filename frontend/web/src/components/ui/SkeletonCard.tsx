'use client'

import { AUDITION_CARD } from '../../lib/design-tokens'

/** 오디션 카드 스켈레톤 - 픽셀 스펙 동일 */
export function SkeletonAuditionCard() {
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${AUDITION_CARD.borderColor}`,
        borderRadius: AUDITION_CARD.borderRadiusPx,
        padding: AUDITION_CARD.paddingPx,
        height: '100%',
      }}
      className="animate-pulse"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: 1, height: 18, background: '#e5e7eb', borderRadius: 4 }} />
        <div style={{ width: 56, height: 22, background: '#e5e7eb', borderRadius: 999 }} />
      </div>
      <div style={{ width: 72, height: 18, background: '#f3f4f6', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 36, background: '#f3f4f6', borderRadius: 4, marginBottom: 16 }} />
      <div
        style={{
          height: AUDITION_CARD.imageHeightPx,
          borderRadius: AUDITION_CARD.imageRadiusPx,
          background: AUDITION_CARD.imageBg,
          marginBottom: 12,
        }}
      />
      <div style={{ height: 14, width: 72, background: '#f3f4f6', borderRadius: 4, marginLeft: 'auto' }} />
    </div>
  )
}

export function SkeletonVideoCard() {
  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${AUDITION_CARD.borderColor}`,
        borderRadius: AUDITION_CARD.borderRadiusPx,
        overflow: 'hidden',
      }}
      className="animate-pulse"
    >
      <div className="aspect-video w-full bg-[#e5e7eb]" />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e5e7eb' }} />
          <div style={{ width: 80, height: 14, background: '#e5e7eb', borderRadius: 4 }} />
        </div>
        <div style={{ height: 16, background: '#e5e7eb', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: 120, background: '#f3f4f6', borderRadius: 4 }} />
      </div>
    </div>
  )
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
