'use client'

import { useTranslations } from 'next-intl'
import type { SnsRow } from '../AuditionApplyForm'

const SNS_PLATFORM_VALUES = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'other'] as const

type ApplySnsSectionProps = {
  snsRows: SnsRow[]
  blocked: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<SnsRow>) => void
}

export default function ApplySnsSection({ snsRows, blocked, onAdd, onRemove, onUpdate }: ApplySnsSectionProps) {
  const t = useTranslations('apply')
  const tCommon = useTranslations('common')

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="min-w-0 whitespace-normal break-words text-lg font-bold text-neutral-900">{t('sectionSns')}</h2>
        <button
          type="button"
          onClick={onAdd}
          disabled={blocked}
          className="min-h-11 whitespace-normal break-words rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 disabled:opacity-50"
        >
          {t('snsAdd')}
        </button>
      </div>
      <p className="mb-3 whitespace-normal break-words text-xs text-neutral-500">{t('snsOptionalHint')}</p>
      <div className="flex flex-col gap-3">
        {snsRows.length === 0 ? <p className="text-sm text-neutral-400">{t('snsEmpty')}</p> : null}
        {snsRows.map((row, index) => (
          <div
            key={index}
            className="flex min-[480px]:flex-row min-[480px]:items-end flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3"
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-600">{t('snsPlatform')}</span>
              <select
                value={row.platform}
                onChange={(e) => onUpdate(index, { platform: e.target.value })}
                disabled={blocked}
                className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm disabled:bg-neutral-100"
              >
                {SNS_PLATFORM_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value === 'other' ? t('snsOther') : labelForPlatform(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-[2] flex-col gap-1">
              <span className="text-xs font-medium text-neutral-600">{t('snsUrl')}</span>
              <input
                type="url"
                value={row.url}
                onChange={(e) => onUpdate(index, { url: e.target.value })}
                disabled={blocked}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm disabled:bg-neutral-100"
                placeholder="https://"
              />
            </label>
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={blocked}
              className="min-h-11 whitespace-normal break-words rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-red-600"
            >
              {tCommon('delete')}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function labelForPlatform(value: string): string {
  if (value === 'twitter') return 'X (Twitter)'
  if (value === 'youtube') return 'YouTube'
  if (value === 'instagram') return 'Instagram'
  if (value === 'tiktok') return 'TikTok'
  if (value === 'facebook') return 'Facebook'
  return value
}
