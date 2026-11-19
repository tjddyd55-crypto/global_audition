'use client'

import { useTranslations } from 'next-intl'
import type { ChannelCareer } from '@/shared/api/channel'
import { CAREER_CATEGORIES, formatCareerPeriod } from '@/shared/channel/discovery'
import { TranslationNotice, translatedText, useContentTranslation } from '@/components/i18n/TranslatedField'

/** 공개 채널 '활동 경력' 탭: 구분별 묶음. 경력이 없으면 빈 안내만. */
export function ChannelCareerList({ careers, legacyText }: { careers: ChannelCareer[]; legacyText?: string | null }) {
  const t = useTranslations('channel')
  const groups = CAREER_CATEGORIES.map((cat) => ({ cat, rows: careers.filter((c) => c.category === cat) })).filter((g) => g.rows.length > 0)
  const legacy = (legacyText ?? '').trim()
  if (groups.length === 0 && !legacy) return <p className="px-3 py-8 text-sm text-neutral-500">{t('careerEmpty')}</p>
  return (
    <div className="flex flex-col gap-5 px-3 py-4" data-testid="channel-career-list">
      {groups.map((g) => (
        <section key={g.cat}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{t(`careerCategory.${g.cat}`)}</h3>
          <ol className="flex flex-col gap-3 border-l-2 border-violet-100 pl-3">
            {g.rows.map((c) => (
              <CareerItem key={c.id} career={c} />
            ))}
          </ol>
        </section>
      ))}
      {legacy ? (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('careerLegacy')}</h3>
          <p className="whitespace-pre-wrap break-words text-sm text-neutral-800">{legacy}</p>
        </section>
      ) : null}
    </div>
  )
}

function CareerItem({ career }: { career: ChannelCareer }) {
  const t = useTranslations('channel')
  const copy = useContentTranslation('CHANNEL_CAREER', career.id)
  const title = translatedText(career.title, copy.view, 'title', copy.showOriginal)
  const desc = translatedText(career.description, copy.view, 'description', copy.showOriginal).trim()
  const period = formatCareerPeriod(career.periodStart, career.periodEnd, t('present'))
  return (
    <li className="min-w-0">
      <p className="break-words text-sm font-semibold text-neutral-900">{title}</p>
      {career.organization || period ? (
        <p className="text-xs text-neutral-500">{[career.organization, period].filter(Boolean).join(' · ')}</p>
      ) : null}
      {desc ? <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-700">{desc}</p> : null}
      <TranslationNotice view={copy.view} showOriginal={copy.showOriginal} onToggle={copy.setShowOriginal} />
    </li>
  )
}
