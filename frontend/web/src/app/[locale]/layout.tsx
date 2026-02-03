import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '../../i18n.config'
import { Providers } from '../providers'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'

// 폰트 최적화: display swap으로 로딩 성능 개선
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap', // 폰트 로딩 중에도 텍스트 표시
  preload: true, // 폰트 프리로드
})

export const metadata: Metadata = {
  title: 'Audition Platform',
  description: 'Online audition platform connecting agencies and applicants',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 지원하지 않는 언어인 경우 404
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // 정적 렌더링을 위해 setRequestLocale 호출 (필수)
  setRequestLocale(locale)

  // 번역 메시지 로드 (캐싱으로 최적화됨)
  const messages = await getMessages()

  // 루트 레이아웃에서 이미 Providers를 제공하므로 여기서는 중복하지 않음
  return (
    <NextIntlClientProvider messages={messages}>
      <div className={`flex flex-col min-h-screen ${inter.variable}`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
