'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { myCastingApi } from '@/shared/api/casting'
import { OfferDeadline, OfferStatusBadge } from '@/components/casting/OfferFacts'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioCastingInboxPage() {
  const t = useTranslations('casting')
  const locale = useLocale()
  const qc = useQueryClient()
  const offers = useQuery({ queryKey: ['me', 'casting-offers'], queryFn: myCastingApi.offers })
  const blocks = useQuery({ queryKey: ['me', 'casting-blocks'], queryFn: myCastingApi.blocks })
  const unblock = useMutation({
    mutationFn: (agencyUserId: string) => myCastingApi.unblock(agencyUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'casting-blocks'] }),
  })

  return (
    <div className="flex flex-col gap-4" data-testid="casting-inbox">
      <h2 className={TITLE_PAGE}>{t('title')}</h2>
      <p className={TEXT_SUB}>{t('intro')}</p>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('safetyTip')}</p>
      {offers.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {offers.isError ? <p className="text-sm text-red-600">{t('loadFailed')}</p> : null}
      {offers.data && offers.data.length === 0 ? <p className={TEXT_SUB}>{t('empty')}</p> : null}
      <ul className="flex flex-col gap-2">
        {(offers.data ?? []).map((o) => (
          <li key={o.id}>
            <Link
              href={`/my/studio/casting/${o.id}`}
              className="flex min-w-0 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-3 no-underline hover:border-violet-300"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <span className={`min-w-0 break-words font-semibold text-neutral-900 ${o.status === 'SENT' ? '' : 'font-medium'}`}>
                  {o.title}
                </span>
                <OfferStatusBadge status={o.status} />
              </div>
              <span className="truncate text-sm text-neutral-600">
                {o.agency?.name ?? '—'}
                {o.agencyBlocked ? ` · ${t('agencyBlockedBadge')}` : ''}
              </span>
              <span className="text-xs text-neutral-500">
                {o.createdAt ? `${t('received')} ${new Date(o.createdAt).toLocaleDateString(locale)} · ` : ''}
                {t('deadline')} <OfferDeadline offer={o} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-neutral-900">{t('blocksTitle')}</h3>
        {blocks.data && blocks.data.length === 0 ? <p className={TEXT_SUB}>{t('noBlocks')}</p> : null}
        <ul className="flex flex-col gap-2">
          {(blocks.data ?? []).map((b) => (
            <li key={b.userId ?? ''} className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 p-2 text-sm">
              <span className="min-w-0 truncate">{b.name ?? '—'}</span>
              <button
                type="button"
                className="shrink-0 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                disabled={!b.userId || unblock.isPending}
                onClick={() => b.userId && unblock.mutate(b.userId)}
              >
                {t('unblock')}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
