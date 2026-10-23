'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { creditsApi } from '@/shared/api/credits'
import { formatCount } from '@/shared/money/currency'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioCreditsPage() {
  const t = useTranslations('studio')
  const locale = useLocale()
  const query = useQuery({ queryKey: ['studio', 'credits'], queryFn: creditsApi.getBalance })

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('credits')}</h2>
      <p className={TEXT_SUB}>{t('creditsHint')}</p>
      {query.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{t('loadFailed')}</p> : null}
      {query.data ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-3">
            <dt className={TEXT_SUB}>{t('balance')}</dt>
            <dd className="text-xl font-bold">{formatCount(query.data.balance, locale)}</dd>
          </div>
          <div className="rounded-lg border border-neutral-200 p-3">
            <dt className={TEXT_SUB}>{t('freeRemaining')}</dt>
            <dd className="text-xl font-bold">{formatCount(query.data.freeRemaining ?? 0, locale)}</dd>
          </div>
          <div className="rounded-lg border border-neutral-200 p-3">
            <dt className={TEXT_SUB}>{t('paidRemaining')}</dt>
            <dd className="text-xl font-bold">{formatCount(query.data.paidRemaining ?? 0, locale)}</dd>
          </div>
          {(query.data.unclassifiedRemaining ?? 0) > 0 ? (
            <div className="rounded-lg border border-neutral-200 p-3">
              <dt className={TEXT_SUB}>{t('unclassifiedRemaining')}</dt>
              <dd className="text-xl font-bold">{formatCount(query.data.unclassifiedRemaining ?? 0, locale)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <p className={TEXT_SUB}>{query.data?.allocationPolicy === 'FREE_FIRST' ? t('policyFreeFirst') : t('policy')}</p>
      {query.data ? (
        <p className={TEXT_SUB}>
          {t('ledgerClosing')} {formatCount(query.data.ledgerClosingBalance ?? 0, locale)} · {t('ledgerSum')}{' '}
          {formatCount(query.data.ledgerAmountSum ?? 0, locale)} ·{' '}
          {query.data.ledgerMatchesWallet ? t('ledgerMatch') : t('ledgerDiffer')}
        </p>
      ) : null}
      <Link href="/credits" className="text-sm font-medium text-neutral-900 underline">
        {t('buyCredits')}
      </Link>
    </div>
  )
}
