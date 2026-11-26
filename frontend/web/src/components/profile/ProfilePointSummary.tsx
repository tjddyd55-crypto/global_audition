'use client'

import { Link } from '@/i18n.config'
import { useLocale, useTranslations } from 'next-intl'

import { usePointQuote } from '@/shared/audition/usePointQuote'

export function ProfilePointSummary({ enabled }: { enabled: boolean }) {
  const t = useTranslations('points')
  const locale = useLocale()
  const { data } = usePointQuote(enabled)
  if (!data) return null
  const number = new Intl.NumberFormat(locale)
  return <section className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3">
    <Link href="/credits" className="rounded-lg border px-3 py-2">{t('credit')} <b>{number.format(data.creditBalance)} C</b></Link>
    <Link href="/points" className="rounded-lg border border-violet-200 px-3 py-2 text-violet-700">{t('balance')} <b>{number.format(data.pointBalance)} P</b></Link>
  </section>
}
