'use client'

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
  backLabel = '← 오디션 상세',
}: ApplyPageHeaderProps) {
  return (
    <div className="mb-6">
      <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 hover:underline">
        {backLabel}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-neutral-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
    </div>
  )
}
