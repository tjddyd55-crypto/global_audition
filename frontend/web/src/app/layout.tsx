// 루트 레이아웃 - Next.js App Router 필수 구조
// next-intl 미들웨어가 자동으로 /를 /ko로 리다이렉트합니다
// 동시에 미들웨어가 주입한 x-device 헤더를 읽어 DeviceProvider에 전달합니다.
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { DeviceProvider } from '@/shared/device/DeviceContext'
import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'

/**
 * PWA 메타데이터.
 * 루트 레이아웃에서 정적으로 내보내면 모든 하위 라우트가 상속받는다.
 */
export const metadata: Metadata = {
  applicationName: 'Global Audition',
  title: { default: 'Global Audition', template: '%s · Global Audition' },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Audition',
  },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/icon.svg' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Next.js App Router에서는 루트 레이아웃이 <html>과 <body>를 반환해야 합니다
  // [locale]/layout.tsx는 내용만 제공합니다
  const device = getDeviceFromHeaders()
  return (
    <html suppressHydrationWarning lang="ko" data-device={device}>
      <body suppressHydrationWarning>
        <DeviceProvider value={device}>
          <Providers>{children}</Providers>
        </DeviceProvider>
      </body>
    </html>
  )
}
