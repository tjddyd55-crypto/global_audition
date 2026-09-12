'use client'

import { useTranslations } from 'next-intl'
import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const SNS_PLATFORM_FALLBACK: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X',
  facebook: 'Facebook',
}

export type SnsLinkRow = { platform: string; url: string }

export type SnsSectionProps = {
  snsLinks: SnsLinkRow[]
}

export function SnsSection({ snsLinks }: SnsSectionProps) {
  const tApply = useTranslations('apply')
  const tMy = useTranslations('myApplications')
  const items = snsLinks.filter((l) => l.url?.trim() && l.platform?.trim())

  return (
    <section className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-4`}>{tApply('sns')}</h2>
      {items.length === 0 ? (
        <p className={`${TEXT_SUB}`}>{tMy('noSns')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((row, idx) => {
            const key = `${row.platform}-${idx}`
            const platform = row.platform.trim().toLowerCase()
            const label =
              platform === 'other' ? tApply('snsOther') : SNS_PLATFORM_FALLBACK[platform] ?? row.platform.trim()
            return (
              <li key={key} className="flex flex-col gap-0.5 rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="shrink-0 text-sm font-medium text-neutral-800">{label}</span>
                <a
                  href={row.url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 break-all text-sm text-[#3B82F6] underline-offset-2 hover:underline"
                >
                  {row.url.trim()}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
