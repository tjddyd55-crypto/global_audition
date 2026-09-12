'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

type ApplicantManagementHeaderProps = {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  applicantTotalCount: number
  maxRoundNumber?: number | null
}

export default function ApplicantManagementHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  applicantTotalCount,
  maxRoundNumber,
}: ApplicantManagementHeaderProps) {
  const t = useTranslations('agency')
  return (
    <div className="sticky top-0 z-30 border-b border-violet-200/80 bg-gradient-to-b from-violet-100/95 to-white/98 shadow-sm backdrop-blur-md">
      <div className={`${PAGE_CONTAINER}`} style={{ paddingTop: 24, paddingBottom: 20 }}>
        <Link href={backHref} className="text-sm font-medium text-violet-700 no-underline hover:underline">
          {backLabel}
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">{t('applicants')}</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 w-full text-base leading-relaxed text-gray-600 md:text-lg">{subtitle}</p>
        ) : null}
        <p className={`${TEXT_SUB} mt-3 whitespace-normal break-words text-sm font-medium text-gray-700`}>
          {t('totalApplicants', { n: applicantTotalCount })}
          {maxRoundNumber != null ? <span className="text-gray-500"> · {t('maxRoundSuffix', { n: maxRoundNumber })}</span> : null}
        </p>
      </div>
    </div>
  )
}
