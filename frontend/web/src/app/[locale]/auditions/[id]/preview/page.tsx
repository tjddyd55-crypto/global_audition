'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { AuditionPostingPreview } from '@/components/audition/AuditionPostingPreview'

export default function AuditionPreviewPage() {
  const params = useParams()
  const t = useTranslations('editor')
  const id = String(params.id ?? '')

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <Link href={`/auditions/${id}/edit`} className="text-sm font-semibold text-violet-700">
          {t('backToEditor')}
        </Link>
      </div>
      <AuditionPostingPreview auditionId={id} />
    </main>
  )
}
