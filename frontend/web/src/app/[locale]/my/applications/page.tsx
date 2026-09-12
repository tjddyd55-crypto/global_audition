'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '../../../../i18n.config'
import { applicationApi } from '@/shared/api/applications'
import { BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, SECTION_GAP, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'
import { applicationStatusMessageKey } from '@/shared/i18n/applicationStatusKey'

function statusBadgeClass(status: string) {
  if (status === 'REVIEWING' || status === 'REVIEWED') return 'rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700'
  if (status === 'ACCEPTED') return 'rounded-full bg-green-50 px-3 py-1 text-sm text-green-700'
  if (status === 'REJECTED') return 'rounded-full bg-red-50 px-3 py-1 text-sm text-red-700'
  return 'rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
}

function formatLocaleDate(iso: string, locale: string): string {
  const tag = locale.startsWith('ko') ? 'ko-KR' : locale.startsWith('mn') ? 'mn-MN' : 'en-US'
  return new Date(iso).toLocaleDateString(tag)
}

export default function MyApplicationsPage() {
  const t = useTranslations('common')
  const tMy = useTranslations('myApplications')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationApi.listMy(),
  })

  const statusLabel = (status: string) => {
    const key = applicationStatusMessageKey(status)
    return key ? tStatus(key) : status
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  if (error) return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div>
          <h1 className={TITLE_PAGE}>{tMy('listTitle')}</h1>
          <p className={`${TEXT_SUB} mt-2`}>{tMy('listHint')}</p>
        </div>
        <div className="flex flex-col gap-4">
          {(data ?? []).map((app) => (
            <div key={app.id} className={`${CARD_BASE} flex items-center justify-between gap-4`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{app.auditionTitle ?? app.auditionId}</p>
                <p className={TEXT_SUB}>{tMy('appliedOn', { date: formatLocaleDate(app.createdAt, locale) })}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={statusBadgeClass(app.status)}>{statusLabel(app.status)}</span>
                <Link href={`/my/applications/${app.id}`} className={`${BTN_SECONDARY} shrink-0`}>
                  {tMy('detail')}
                </Link>
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && (
            <div className={CARD_BASE}>
              <p className={TEXT_SUB}>{tMy('emptyList')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
