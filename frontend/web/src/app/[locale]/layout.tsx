import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '../../i18n.config'
import { Providers } from '../providers'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { MainWidthContainer } from '../../components/layout/MainWidthContainer'
import ErrorBoundary from '../../components/ErrorBoundary'
import { getDeviceFromHeaders } from '@/shared/device/resolveDevice'
import { MobileShell } from '@/mobile/layouts/MobileShell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
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

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()
  const device = getDeviceFromHeaders()

  const body = (
    <main className={device === 'mobile' ? 'flex-1 pt-16' : 'flex-1 pt-16'}>
      <ErrorBoundary>
        <MainWidthContainer>{children}</MainWidthContainer>
      </ErrorBoundary>
    </main>
  )

  return (
    <NextIntlClientProvider messages={messages}>
      <div className={`flex flex-col min-h-screen ${inter.variable}`}>
        <Header />
        {device === 'mobile' ? <MobileShell>{body}</MobileShell> : (
          <>
            {body}
            <Footer />
          </>
        )}
      </div>
    </NextIntlClientProvider>
  )
}
