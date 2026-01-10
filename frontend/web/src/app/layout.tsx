// 루트 레이아웃 - Next.js App Router 필수 구조
// next-intl 미들웨어가 자동으로 /를 /ko로 리다이렉트합니다
import './globals.css'
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Next.js App Router에서는 루트 레이아웃이 <html>과 <body>를 반환해야 합니다
  // [locale]/layout.tsx는 내용만 제공합니다
  return (
    <html suppressHydrationWarning lang="ko">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
