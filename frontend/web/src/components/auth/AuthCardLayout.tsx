import type { ReactNode } from 'react'
import { SIGNUP } from '../../lib/design-tokens'

interface AuthCardLayoutProps {
  title: string
  children: ReactNode
}

export default function AuthCardLayout({ title, children }: AuthCardLayoutProps) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
      }}
    >
      <div
        style={{
          width: SIGNUP.cardWidthPx,
          maxWidth: '100%',
          margin: `${SIGNUP.cardMarginTopPx}px auto`,
          padding: SIGNUP.cardPaddingPx,
          borderRadius: SIGNUP.cardRadiusPx,
          border: `1px solid ${SIGNUP.cardBorderColor}`,
          background: 'white',
        }}
      >
        <h1
          style={{
            fontSize: SIGNUP.titleFontSizePx,
            fontWeight: SIGNUP.titleFontWeight,
            textAlign: 'center',
            margin: '0 0 24px 0',
          }}
        >
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
