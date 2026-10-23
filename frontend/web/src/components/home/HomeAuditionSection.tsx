'use client'

import { Link } from '../../i18n.config'
import AuditionCard from '../cards/AuditionCard'
import { SkeletonAuditionCard } from '../ui/SkeletonCard'
import EmptyState from '../ui/EmptyState'
import { LAYOUT } from '@/shared/design-tokens'
import { useTranslations } from 'next-intl'
import type { AuditionDto } from '@/shared/types/audition'
import { AuditionAudienceFilter } from '@/components/audition/AuditionAudienceFilter'
import type { AudienceFilterOption } from '@/shared/audition/audienceSelection'

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
  country: AudienceFilterOption
  onCountryChange: (country: AudienceFilterOption) => void
  heading?: string
  showFilter?: boolean
  compact?: boolean
}

export default function HomeAuditionSection({
  auditions,
  isLoading,
  country,
  onCountryChange,
  heading,
  showFilter = true,
  compact = false,
}: HomeAuditionSectionProps) {
  const t = useTranslations('home')
  const tAud = useTranslations('auditions')
  const displayAuditions = auditions.slice(0, 3)
  const isEmpty = !isLoading && displayAuditions.length === 0

  return (
    <section style={compact ? { paddingTop: 8, paddingBottom: 24 } : sectionStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: compact ? 12 : 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: compact ? 0 : '0 0 8px 0' }}>{heading ?? t('openAuditions')}</h2>
          {compact ? null : <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{tAud('description')}</p>}
        </div>
        {showFilter ? <AuditionAudienceFilter country={country} onChange={onCountryChange} /> : null}
      </div>

      {isLoading ? (
        <div className="flex w-full flex-col">
          {[1, 2, 3].map((i) => (
            <SkeletonAuditionCard key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <div style={containerStyle}>
          <EmptyState message={tAud('emptyList')} />
        </div>
      ) : (
        <div className={compact ? 'grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex w-full flex-col'}>
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
            {t('seeAllAuditions')}
          </Link>
        </div>
      </div>
    </section>
  )
}
