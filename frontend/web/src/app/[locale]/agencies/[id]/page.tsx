'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { useParams } from 'next/navigation'
import { publicPlatformApi } from '@/shared/api/publicPlatform'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function AgencyDetailPage() {
  const t = useTranslations('agencies')
  const params = useParams<{ id: string }>()
  const query = useQuery({
    queryKey: ['public-agency', params.id],
    queryFn: () => publicPlatformApi.agency(params.id),
    enabled: Boolean(params.id),
  })
  const agency = query.data

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 pb-16 pt-24">
      {query.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{t('loadFailed')}</p> : null}
      {agency ? (
        <>
          <h1 className={TITLE_PAGE}>{agency.displayName}</h1>
          <p className={TEXT_SUB}>{agency.countryCode}</p>
          {agency.website ? (
            <a href={agency.website} className="text-sm underline">
              {agency.website}
            </a>
          ) : null}
          <h2 className="text-lg font-semibold">{t('openAuditions')}</h2>
          {agency.auditions.length === 0 ? <p className={TEXT_SUB}>{t('noAuditions')}</p> : null}
          <ul className="flex flex-col gap-3">
            {agency.auditions.map((audition) => (
              <li key={audition.id} className="rounded-lg border border-neutral-200 p-3">
                <Link href={`/auditions/${audition.id}`} className="font-medium">
                  {audition.title}
                </Link>
                <p className={TEXT_SUB}>{audition.status}</p>
                <Link href={`/auditions/${audition.id}/apply`} className="text-sm underline">
                  {t('apply')}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
