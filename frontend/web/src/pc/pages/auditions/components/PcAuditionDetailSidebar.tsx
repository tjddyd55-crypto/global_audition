'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AUDITION_DETAIL } from '@/shared/design-tokens'
import { safeStr } from '@/shared/utils/safe'

type PcAuditionDetailSidebarProps = {
  agencyLogo?: string | null
  agencyName?: string | null
  remainingDays: number
  recruitList: string[]
  createdAtFormatted: string
  endDateFormatted: string
  location: string
}

export default function PcAuditionDetailSidebar({
  agencyLogo,
  agencyName,
  remainingDays,
  recruitList,
  createdAtFormatted,
  endDateFormatted,
  location,
}: PcAuditionDetailSidebarProps) {
  const t = useTranslations('auditionDetail')

  return (
    <aside className="flex flex-col">
      <div className="border-t border-neutral-200 px-0 py-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: AUDITION_DETAIL.mainGridGapPx }}>
          <div
            style={{
              position: 'relative',
              width: 48,
              height: 48,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#f3f4f6',
              flexShrink: 0,
            }}
          >
            {agencyLogo ? (
              <Image src={safeStr(agencyLogo)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
            ) : null}
          </div>
          <div>
            <div style={{ fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: 600 }}>
              {safeStr(agencyName) || t('agencyFallback')}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: AUDITION_DETAIL.galleryGapPx,
                fontSize: AUDITION_DETAIL.bodyFontPx,
                padding: '2px 8px',
                borderRadius: 999,
                background: AUDITION_DETAIL.verifiedBadgeBg,
                color: AUDITION_DETAIL.verifiedBadgeColor,
                fontWeight: 600,
              }}
            >
              Verified
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-0 py-4">
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          {t('stats')}
        </h3>
        <div
          style={{
            fontSize: AUDITION_DETAIL.bodyFontPx,
            color: AUDITION_DETAIL.bodyColor,
            display: 'flex',
            flexDirection: 'column',
            gap: AUDITION_DETAIL.galleryGapPx,
          }}
        >
          <div>{t('daysLeftPeriod', { n: remainingDays })}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: AUDITION_DETAIL.galleryGapPx, marginTop: AUDITION_DETAIL.galleryGapPx }}>
            {recruitList.map((tag, idx) => (
              <span
                key={`tag-${idx}-${tag.slice(0, 20)}`}
                style={{
                  fontSize: AUDITION_DETAIL.metaMutedPx,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                  color: '#444',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-0 py-4">
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          {t('quickInfo')}
        </h3>
        <dl style={{ margin: 0, fontSize: AUDITION_DETAIL.metaMutedPx, color: AUDITION_DETAIL.metaMutedColor }}>
          <dt style={{ marginTop: AUDITION_DETAIL.galleryGapPx, fontWeight: 600, color: '#333' }}>{t('registeredAt')}</dt>
          <dd style={{ margin: '4px 0 0 0' }}>{createdAtFormatted}</dd>
          <dt style={{ marginTop: AUDITION_DETAIL.benefitGridGapPx, fontWeight: 600, color: '#333' }}>{t('endDate')}</dt>
          <dd style={{ margin: '4px 0 0 0' }}>{endDateFormatted}</dd>
          <dt style={{ marginTop: AUDITION_DETAIL.benefitGridGapPx, fontWeight: 600, color: '#333' }}>{t('location')}</dt>
          <dd style={{ margin: '4px 0 0 0' }}>{location}</dd>
        </dl>
      </div>
    </aside>
  )
}
