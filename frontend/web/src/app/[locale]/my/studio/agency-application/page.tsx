'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { apiClient } from '@/shared/api/client'
import { unwrapData } from '@/shared/api/unwrap'
import { authApi } from '@/shared/api/auth'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

type AgencyApplication = {
  id: string
  countryCode: string
  displayName: string
  legalName: string | null
  stage: string
  approvalState: string
  origin: string | null
  supplementReason: string | null
}

export default function AgencyApplicationPage() {
  const t = useTranslations('studio')
  const query = useQuery({
    queryKey: ['me', 'agency-application'],
    queryFn: async () => {
      const { data } = await apiClient.get<unknown>('/me/agency-application')
      return unwrapData<AgencyApplication | null>(data)
    },
  })

  useEffect(() => {
    if (query.data?.approvalState !== 'APPROVED') return
    void authApi.refreshSession()
  }, [query.data?.approvalState])

  return (
    <div className="flex max-w-2xl flex-col gap-4" data-testid="agency-application">
      <h2 className={TITLE_PAGE}>{t('agencyApplication')}</h2>
      {query.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{t('loadFailed')}</p> : null}
      {query.isSuccess && !query.data ? <p className={TEXT_SUB}>{t('agencyApplicationEmpty')}</p> : null}
      {query.data ? (
        <div className="rounded-lg border border-neutral-200 p-4 text-sm">
          <p data-testid="agency-application-state">
            {query.data.displayName} · {query.data.countryCode} · {query.data.approvalState} · {query.data.stage}
          </p>
          <p className={`mt-2 ${TEXT_SUB}`}>{query.data.legalName || '—'}</p>
          {query.data.origin === 'SIGNUP' ? <p className={`mt-2 ${TEXT_SUB}`}>{t('agencyApplication')}</p> : null}
          {query.data.supplementReason ? (
            <p className="mt-3 text-amber-800" data-testid="agency-supplement">
              {t('agencySupplement')}: {query.data.supplementReason}
            </p>
          ) : null}
          {query.data.approvalState === 'APPROVED' ? (
            <Link href="/my/dashboard" className="mt-4 inline-block font-medium underline">
              {t('agencyAccess')}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
