'use client'

import { useState } from 'react'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import { apiClient } from '@/shared/api/client'
import { TranslationNotice } from '@/components/i18n/TranslatedField'
import { overlayPosting } from '@/shared/i18n/postingTranslation'
import type { ContentTranslationView } from '@/shared/i18n/contentTranslation'
import { CONTENT_AUTHORING_LOCALES } from '@/shared/audition/audience'
import { dateFnsLocale } from '@/shared/datetime/dateFnsLocale'
import { safeArr, safeNum, safeStr } from '@/shared/utils/safe'
import { AuditionDetailHeroSection } from '@/components/audition/AuditionDetailHeroSection'
import PcAuditionDetailInfo from '@/pc/pages/auditions/components/PcAuditionDetailInfo'
import PcAuditionDetailSidebar from '@/pc/pages/auditions/components/PcAuditionDetailSidebar'
import PcAuditionBenefitsSection from '@/pc/pages/auditions/components/PcAuditionBenefitsSection'
import PcAuditionDetailApplyBar from '@/pc/pages/auditions/components/PcAuditionDetailApplyBar'
import MobileAuditionDetailSummary from '@/mobile/pages/auditions/components/MobileAuditionDetailSummary'
import {
  auditionDetailMediumUrl,
  auditionDetailOriginalUrl,
  auditionHeadlineTitle,
  normalizeAuditionImages,
} from '@/shared/types/audition'
import { roundStatusLabel } from '@/shared/audition/roundStatusLabel'

type Layout = 'pc' | 'native'

type Props = {
  auditionId: string
}

export function AuditionPostingPreview({ auditionId }: Props) {
  const t = useTranslations('editor')
  const tDetail = useTranslations('auditionDetail')
  const tStatus = useTranslations('status')
  const tLocale = useTranslations('locale')
  const uiLocale = useLocale()
  const [locale, setLocale] = useState('en')
  const [layout, setLayout] = useState<Layout>('pc')
  const [showOriginal, setShowOriginal] = useState(false)
  const query = useQuery({
    queryKey: ['audition-preview', auditionId, locale],
    queryFn: () => auditionApi.getPreview(auditionId, locale),
    enabled: Boolean(auditionId),
  })
  const engine = useQuery({
    queryKey: ['content-translation', 'AUDITION_POSTING', auditionId, locale, showOriginal],
    enabled: Boolean(auditionId),
    retry: false,
    queryFn: async (): Promise<ContentTranslationView | null> => {
      try {
        const { data } = await apiClient.get<ContentTranslationView>(
          `/content-translations/AUDITION_POSTING/${auditionId}`,
          { params: { locale, original: showOriginal } },
        )
        return data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null
        throw error
      }
    },
  })
  const audition = query.data ? overlayPosting(query.data, engine.data) : undefined

  const fmt = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy.MM.dd', { locale: dateFnsLocale(uiLocale) })
    } catch {
      return '-'
    }
  }

  return (
    <div data-testid="audition-posting-preview">
      <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <h1 className="text-lg font-bold">{t('previewReadOnlyTitle')}</h1>
        <p className="mt-1 text-sm text-amber-950">{t('previewReadOnlyHint')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTENT_AUTHORING_LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`min-h-10 rounded-full px-3 text-sm font-semibold ${
                locale === code ? 'bg-black text-white' : 'border border-gray-300 bg-white'
              }`}
            >
              {tLocale(code)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" className="min-h-10 rounded-lg border px-3 text-sm" onClick={() => setLayout('pc')}>
            {t('previewPc')}
          </button>
          <button type="button" className="min-h-10 rounded-lg border px-3 text-sm" onClick={() => setLayout('native')}>
            {t('previewNative')}
          </button>
        </div>
        {audition ? (
          <p className="mt-3 text-sm text-gray-800" data-testid="preview-translation-state">
            {t('previewStatus', {
              status: audition.translationStatus ?? (audition.showingOriginal ? 'ORIGINAL' : '-'),
              stale: audition.translationStale ? t('translationStale') : t('translationFresh'),
              fallback: audition.contentLocaleFallback ? tDetail('contentFallback') : t('previewExact'),
            })}
          </p>
        ) : null}
        {audition?.translationErrorCode ? (
          <p className="mt-1 text-sm text-red-700">{audition.translationErrorCode}</p>
        ) : null}
        <div className="mt-3" data-testid="preview-translation-compare">
          <TranslationNotice
            view={engine.data ?? null}
            showOriginal={showOriginal}
            onToggle={setShowOriginal}
          />
          {engine.data?.errorCode ? <p className="mt-1 text-sm text-amber-900">{engine.data.errorCode}</p> : null}
        </div>
      </div>

      {query.isLoading ? <p>{t('previewLoading')}</p> : null}
      {query.isError ? <p className="text-red-700">{t('previewLoadFailed')}</p> : null}

      {audition && layout === 'pc' ? (
        <div data-testid="preview-layout-pc">
          <AuditionDetailHeroSection
            auditionId={auditionId}
            heroImageMediumUrl={safeStr(auditionDetailMediumUrl(normalizeAuditionImages(audition.images)))}
            heroImageOriginalUrl={safeStr(auditionDetailOriginalUrl(normalizeAuditionImages(audition.images)))}
            title={auditionHeadlineTitle(audition)}
            status={String(audition.status)}
            statusPillText={roundStatusLabel(audition.status, audition.round, tStatus)}
            tags={safeArr(audition.tags)}
            endDateFormatted={fmt(safeStr(audition.endDate))}
            location={safeStr(audition.location)}
            subtitle={safeStr(audition.description).split('\n').find((line) => line.trim()) ?? ''}
            interactionsDisabled
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <PcAuditionDetailInfo
              descriptionText={safeStr(audition.description)}
              recruitList={safeArr(audition.recruitFields)}
              qualifications={safeArr(audition.qualifications)}
              schedules={safeArr(audition.schedules)}
            />
            <PcAuditionDetailSidebar
              agencyLogo={audition.agencyLogo}
              agencyName={audition.agencyName}
              remainingDays={safeNum(audition.remainingDays)}
              recruitList={safeArr(audition.recruitFields)}
              createdAtFormatted={fmt(safeStr(audition.createdAt))}
              endDateFormatted={fmt(safeStr(audition.endDate))}
              location={safeStr(audition.location)}
            />
          </div>
          <PcAuditionBenefitsSection benefits={safeArr(audition.benefits)} />
          <PcAuditionDetailApplyBar
            interactionsDisabled
            auditionId={auditionId}
            isOpen={false}
            alreadyApplied={false}
            showApplySubmitCta={false}
            showApplyLoginCta={false}
            showApplyDisabledCta={false}
            applyNavDisabledCombined
            applyNavBlockedBySeries={false}
            applyPolicyLoading={false}
            balanceLoading={false}
            isMultiRoundAudition={false}
            myApplicantRoundNumber={1}
            creditBalanceAmount={0}
            needCreditsForApply={false}
            creditGateReady
            hasEnoughCredits
            applyPolicyError={false}
          />
        </div>
      ) : null}

      {audition && layout === 'native' ? (
        <div className="mx-auto max-w-[420px] border bg-white" data-testid="preview-layout-native">
          <MobileAuditionDetailSummary
            audition={audition}
            isOpen={audition.status === 'OPEN'}
            alreadyApplied={false}
            applyBlocked={false}
            readOnly
          />
          <div className="border-t p-3">
            <button type="button" disabled className="w-full rounded-lg bg-black py-4 text-white opacity-60">
              {t('previewApplyDisabled')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
