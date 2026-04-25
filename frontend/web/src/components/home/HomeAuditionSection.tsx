'use client'

import { Link } from '../../i18n.config'
import AuditionCard from '../cards/AuditionCard'
import { SkeletonAuditionCard } from '../ui/SkeletonCard'
import EmptyState from '../ui/EmptyState'
import { LAYOUT } from '@/shared/design-tokens'
import type { AuditionDto } from '@/shared/types/audition'

const containerStyle: React.CSSProperties = {
  maxWidth: LAYOUT.containerMaxWidth,
  margin: '0 auto',
  padding: `0 ${LAYOUT.containerPaddingPx}px`,
}

const sectionStyle: React.CSSProperties = {
  paddingTop: LAYOUT.sectionGapPx,
  paddingBottom: LAYOUT.sectionGapPx,
}

type HomeAuditionSectionProps = {
  auditions: AuditionDto[]
  isLoading: boolean
}

export default function HomeAuditionSection({ auditions, isLoading }: HomeAuditionSectionProps) {
  const displayAuditions = auditions.slice(0, 3)
  const isEmpty = !isLoading && displayAuditions.length === 0

  return (
    <section style={sectionStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>진행 중인 오디션</h2>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>지금 바로 지원 가능한 오디션을 확인하세요</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col">
          {[1, 2, 3].map((i) => (
            <SkeletonAuditionCard key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <div style={containerStyle}>
          <EmptyState message="등록된 오디션이 없습니다" />
        </div>
      ) : (
        <div className="flex w-full flex-col">
          {displayAuditions.map((audition, i) => (
            <AuditionCard key={audition?.id ?? `audition-${i}`} audition={audition} />
          ))}
        </div>
      )}

      <div style={containerStyle}>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            href="/auditions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 8,
              border: '1px solid #ddd',
              background: 'white',
              fontSize: 14,
              color: '#333',
              textDecoration: 'none',
            }}
          >
            모든 오디션 보기
          </Link>
        </div>
      </div>
    </section>
  )
}
