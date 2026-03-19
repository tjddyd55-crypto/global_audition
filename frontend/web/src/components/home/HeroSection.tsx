'use client'

import { Link } from '../../i18n.config'
import { HERO } from '../../lib/design-tokens'

interface HeroSectionProps {
  title: string
  subtitle: string
  auditionLabel: string
  startLabel: string
}

export default function HeroSection({
  title,
  subtitle,
  auditionLabel,
  startLabel,
}: HeroSectionProps) {
  return (
    <section
      style={{
        paddingTop: HERO.paddingTopPx,
        paddingBottom: HERO.paddingBottomPx,
        textAlign: 'center',
        background: `linear-gradient(to bottom, ${HERO.gradientStart}, ${HERO.gradientEnd})`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <h1
          style={{
            fontSize: HERO.titleFontSizePx,
            fontWeight: HERO.titleFontWeight,
            lineHeight: HERO.titleLineHeight,
            color: '#000',
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            marginTop: HERO.subMarginTopPx,
            fontSize: HERO.subFontSizePx,
            color: HERO.subColor,
            marginBottom: 0,
          }}
        >
          {subtitle}
        </p>
        <div
          style={{
            marginTop: HERO.buttonsMarginTopPx,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: HERO.buttonsGapPx,
          }}
        >
          <Link
            href="/auditions"
            style={{
              height: HERO.buttonHeightPx,
              paddingLeft: HERO.buttonPaddingPx,
              paddingRight: HERO.buttonPaddingPx,
              borderRadius: HERO.buttonRadiusPx,
              background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
              color: 'white',
              fontWeight: 500,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            {auditionLabel}
          </Link>
          <Link
            href="/register"
            style={{
              height: HERO.buttonHeightPx,
              paddingLeft: HERO.buttonPaddingPx,
              paddingRight: HERO.buttonPaddingPx,
              borderRadius: HERO.buttonRadiusPx,
              border: `1px solid ${HERO.secondaryBorderColor}`,
              background: 'white',
              color: '#333',
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
          >
            {startLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}
