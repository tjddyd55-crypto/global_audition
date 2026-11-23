'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { auditionSaveQueryKeys, auditionSavesApi, type SavedAuditionItem } from '@/shared/api/auditionSaves'
import { intlTagForUiLocale } from '@/shared/i18n/uiLocales'
import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'
import SaveAuditionButton from './SaveAuditionButton'

function statusLabel(status: SavedAuditionItem['recruitmentStatus'], t: (key: 'statusOpen' | 'statusClosed' | 'statusUpcoming') => string) {
  if (status === 'CLOSED') return t('statusClosed')
  if (status === 'UPCOMING') return t('statusUpcoming')
  return t('statusOpen')
}

function formatDate(value: string | null | undefined, locale: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(intlTagForUiLocale(locale))
}

export default function SavedAuditionList() {
  const t = useTranslations('savedAuditions')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const query = useQuery({
    queryKey: auditionSaveQueryKeys.list,
    queryFn: auditionSavesApi.list,
  })

  if (query.isLoading) return <p className={TEXT_SUB}>{tCommon('loading')}</p>
  if (query.isError) return <p className="text-sm text-red-600">{tCommon('loadFailedTitle')}</p>
  if (!query.data || query.data.length === 0) return <p className={TEXT_SUB}>{t('empty')}</p>

  return (
    <ul className="flex flex-col gap-3">
      {query.data.map((item) => {
        if (!item.available) {
          return (
            <li key={item.auditionId} className={`${CARD_BASE} p-4`}>
              <p className="font-medium text-neutral-800">{t('unavailable')}</p>
              <p className={`mt-1 ${TEXT_SUB}`}>{t('unavailableHint')}</p>
              <div className="mt-3">
                <SaveAuditionButton auditionId={item.auditionId} className="!border-neutral-300 !bg-neutral-800" />
              </div>
            </li>
          )
        }
        const due = formatDate(item.deadlineAt || item.endDate, locale)
        return (
          <li key={item.auditionId} className={`${CARD_BASE} relative overflow-hidden`}>
            <Link href={`/auditions/${item.auditionId}`} className="flex min-h-[108px] text-inherit no-underline">
              <div className="relative w-28 shrink-0 bg-neutral-200 sm:w-36">
                {item.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 p-3 pr-14">
                <span className="inline-block rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {statusLabel(item.recruitmentStatus, t)}
                </span>
                <h3 className="mt-1 line-clamp-2 break-words text-base font-semibold text-neutral-900">{item.title}</h3>
                {item.agencyName ? <p className={`mt-1 truncate ${TEXT_SUB}`}>{item.agencyName}</p> : null}
                {due ? <p className={`mt-0.5 ${TEXT_SUB}`}>{t('deadline', { date: due })}</p> : null}
              </div>
            </Link>
            <div className="absolute right-3 top-3">
              <SaveAuditionButton auditionId={item.auditionId} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
