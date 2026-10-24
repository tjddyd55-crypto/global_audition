'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { publicPlatformApi } from '@/shared/api/publicPlatform'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function AgenciesPage() {
  const t = useTranslations('agencies')
  const query = useQuery({ queryKey: ['public-agencies'], queryFn: () => publicPlatformApi.agencies() })

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 pb-16 pt-24 max-lg:gap-3 max-lg:px-4 max-lg:pt-4">
      <div className="flex flex-col gap-1 max-lg:gap-0.5">
        <h1 className={`${TITLE_PAGE} max-lg:text-xl max-lg:font-bold max-lg:leading-tight`}>{t('title')}</h1>
        <p className={`${TEXT_SUB} max-lg:text-[13px]`}>{t('hint')}</p>
      </div>
      {query.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {query.isError ? <p className="text-sm text-red-600">{t('loadFailed')}</p> : null}
      {query.data && query.data.length === 0 ? <p className={TEXT_SUB}>{t('empty')}</p> : null}
      <ul className="flex flex-col gap-3">
        {(query.data ?? []).map((agency) => (
          <li key={agency.id} className="rounded-lg border border-neutral-200 p-4 max-lg:rounded-xl max-lg:p-3">
            <Link href={`/agencies/${agency.id}`} className="text-lg font-semibold max-lg:text-base max-lg:leading-snug">
              {agency.displayName}
            </Link>
            <p className={TEXT_SUB}>
              {agency.countryCode}
              {agency.website ? ` · ${agency.website}` : ''}
            </p>
            <p className={TEXT_SUB}>{t('openCount', { count: agency.openAuditionCount })}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
