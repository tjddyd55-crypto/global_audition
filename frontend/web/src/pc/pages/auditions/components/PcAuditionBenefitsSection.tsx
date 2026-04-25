'use client'

import { AUDITION_DETAIL } from '@/shared/design-tokens'

type PcAuditionBenefitsSectionProps = {
  benefits: string[]
}

export default function PcAuditionBenefitsSection({ benefits }: PcAuditionBenefitsSectionProps) {
  if (benefits.length === 0) {
    return null
  }

  return (
    <section className="border-t border-neutral-200 py-6" style={{ marginTop: AUDITION_DETAIL.sectionGapPx }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>혜택</h2>
      <div className="flex flex-col divide-y divide-neutral-200">
        {benefits.map((b, i) => (
          <div
            key={`b-${i}-${b.slice(0, 24)}`}
            style={{
              padding: AUDITION_DETAIL.benefitCardPaddingPx,
              fontSize: AUDITION_DETAIL.bodyFontPx,
              color: AUDITION_DETAIL.bodyColor,
            }}
          >
            {b}
          </div>
        ))}
      </div>
    </section>
  )
}
