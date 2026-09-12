'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'

type ApplyPageHeaderProps = {
  auditionId: string
  title: string
  description?: string
  backLabel?: string
}

export default function ApplyPageHeader({
  auditionId,
  title,
  description,
  backLabel,
}: ApplyPageHeaderProps) {
  const t = useTranslations('apply')
  const resolvedBack = backLabel ?? `← ${t('backToDetailShort')}`
  return (
    <div className="mb-6">
      <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 hover:underline">
        {resolvedBack}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-neutral-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
    </div>
  )
}
