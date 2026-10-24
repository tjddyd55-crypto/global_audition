'use client'

import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import { dateFnsLocale } from '@/shared/datetime/dateFnsLocale'
import { AUDITION_DETAIL } from '@/shared/design-tokens'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '@/shared/utils/safe'
import { AuditionDetailHeroSection } from '@/components/audition/AuditionDetailHeroSection'
import { TranslationNotice, useContentTranslation } from '@/components/i18n/TranslatedField'
import { overlayPosting } from '@/shared/i18n/postingTranslation'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import PageSurface from '@/components/layout/PageSurface'
import DetailContentShell from '@/components/layout/DetailContentShell'
import DetailTwoColumnGrid from '@/components/layout/DetailTwoColumnGrid'
import CenteredPageState from '@/components/layout/CenteredPageState'
import { roundIdForRoundNumber } from '@/shared/audition/roundNav'
import { useAuditionDetailState } from '@/shared/audition/useAuditionDetailState'
import { useAuditionApplyCreditGate } from '@/shared/audition/useAuditionApplyCreditGate'
import PcAuditionDetailInfo from './components/PcAuditionDetailInfo'
import PcAuditionBenefitsSection from './components/PcAuditionBenefitsSection'
import PcAuditionDetailSidebar from './components/PcAuditionDetailSidebar'
import PcAuditionDetailApplyBar from './components/PcAuditionDetailApplyBar'
import {
  auditionDetailMediumUrl,
  auditionDetailOriginalUrl,
  auditionHeadlineTitle,
  normalizeAuditionImages,
} from '@/shared/types/audition'
import { roundStatusLabel } from '@/shared/audition/roundStatusLabel'

export default function PcAuditionDetailPage() {
  const params = useParams()
  const t = useTranslations('common')
  const tDetail = useTranslations('auditionDetail')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const id = params.id as string

  const {
    audition,
    isLoading,
    error,
    isOpen,
    alreadyApplied,
    isMultiRoundAudition,
    seriesRound,
    showApplyLoginCta,
    showApplySubmitCta,
    showApplyDisabledCta,
  } = useAuditionDetailState(id)

  const {
    applyPolicySnapshot,
    applyPolicyLoading,
    applyPolicyError,
    balanceLoading,
    creditBalanceAmount,
    needCreditsForApply,
    creditGateReady,
    hasEnoughCredits,
    applyNavDisabledForCredits,
  } = useAuditionApplyCreditGate({
    auditionId: id,
    isOpen,
    showApplySubmitCta,
    alreadyApplied,
  })
  const posting = useContentTranslation('AUDITION_POSTING', id)

  if (isLoading) {
    return (
      <CenteredPageState>
        <div style={{ fontSize: AUDITION_DETAIL.bodyFontPx }}>{t('loading')}</div>
      </CenteredPageState>
    )
  }

  if (error || !audition) {
    return (
      <CenteredPageState>
        <div style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: '#b91c1c' }}>{t('error')}</div>
      </CenteredPageState>
    )
  }

  const shown = overlayPosting(audition, posting.view)
  const embed = getVideoEmbedSrc(safeStr(shown.videoUrl))
  const galleryRaw = safeArr(shown.galleryImages)
  const imgs = normalizeAuditionImages(audition.images)
  const heroMedium = safeStr(auditionDetailMediumUrl(imgs))
  const heroOriginal = safeStr(auditionDetailOriginalUrl(imgs))
  /** 갤러리에서 대표 원본·파생과 동일한 URL 제거 */
  const coverDedupUrls = new Set(
    [imgs.original, imgs.medium, imgs.thumb].map((u) => (u != null ? safeStr(u) : '')).filter(Boolean),
  )
  const galleryExtra = galleryRaw
    .map((src) => safeStr(src))
    .filter((s) => s.length > 0 && !coverDedupUrls.has(s))
    .slice(0, 24)
  const recruitList = safeArr(shown.recruitFields)
  const qualifications = safeArr(shown.qualifications)
  const schedules = safeArr(shown.schedules)
  const benefits = safeArr(shown.benefits)
  const auditionTags = safeArr(audition.tags)
  const headlineTitle = auditionHeadlineTitle(shown)
  const descriptionText = safeStr(shown.description)
  const heroSubtitle =
    descriptionText
      .split(/\n/)
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? ''
  const remainingDaysVal = safeNum(audition.remainingDays)
  const deadlineUrgent = isOpen && remainingDaysVal <= 3 && remainingDaysVal >= 0

  const auditionRoundSummaries = audition.roundSummaries ?? []
  const myApplicationIdForRound = audition.myApplicationId
  const myApplicantRoundNumber = audition.myCurrentRoundNumber ?? 1
  const myCurrentRoundUuid: string | null =
    myApplicationIdForRound != null && myApplicationIdForRound.length > 0
      ? roundIdForRoundNumber(auditionRoundSummaries, myApplicantRoundNumber)
      : null

  const applyNavBlockedBySeries = Boolean(
    showApplySubmitCta &&
      !alreadyApplied &&
      seriesRound >= 2 &&
      audition.canApply === false
  )

  const applyNavDisabledCombined = applyNavDisabledForCredits || applyNavBlockedBySeries

  const fmt = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy.MM.dd', { locale: dateFnsLocale(locale) })
    } catch {
      return '-'
    }
  }

  return (
    <PageSurface background={AUDITION_DETAIL.pageBackgroundMuted}>
      <AuditionDetailHeroSection
        auditionId={id}
        heroImageMediumUrl={heroMedium}
        heroImageOriginalUrl={heroOriginal}
        title={headlineTitle}
        status={String(audition.status)}
        statusPillText={roundStatusLabel(audition.status, audition.round, tStatus)}
        tags={auditionTags}
        endDateFormatted={fmt(safeStr(audition.endDate))}
        location={safeStr(audition.location)}
        subtitle={heroSubtitle}
        deadlineUrgent={deadlineUrgent}
      />
      <div className="mx-auto mt-2 max-w-5xl px-4" data-testid="posting-translation-notice">
        <TranslationNotice view={posting.view} showOriginal={posting.showOriginal} onToggle={posting.setShowOriginal} />
      </div>

      {embed ? (
        <section className="mt-4 w-full">
          <h2
            className="mb-2 w-full text-lg font-semibold"
            style={{
              paddingLeft: 'max(1rem, env(safe-area-inset-left))',
              paddingRight: 'max(1rem, env(safe-area-inset-right))',
            }}
          >
            {tDetail('introVideoTitle')}
          </h2>
          <div className="aspect-video w-full bg-black">
            <iframe
              title="audition-video"
              src={embed}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      {galleryExtra.length > 0 ? <AuditionDetailMediaSection galleryUrls={galleryExtra} /> : null}

      <DetailContentShell style={{ paddingTop: AUDITION_DETAIL.sectionGapPx }}>
        <DetailTwoColumnGrid gap={AUDITION_DETAIL.mainGridGapPx}>
          <PcAuditionDetailInfo
            descriptionText={descriptionText}
            recruitList={recruitList}
            qualifications={qualifications}
            schedules={schedules}
          />

          <PcAuditionDetailSidebar
            agencyLogo={audition.agencyLogo}
            agencyName={audition.agencyName}
            remainingDays={remainingDaysVal}
            recruitList={recruitList}
            createdAtFormatted={fmt(safeStr(audition.createdAt))}
            endDateFormatted={fmt(safeStr(audition.endDate))}
            location={safeStr(audition.location)}
          />
        </DetailTwoColumnGrid>

        <PcAuditionBenefitsSection benefits={benefits} />
      </DetailContentShell>

      <PcAuditionDetailApplyBar
        auditionId={id}
        isOpen={isOpen}
        alreadyApplied={alreadyApplied}
        showApplySubmitCta={showApplySubmitCta}
        showApplyLoginCta={showApplyLoginCta}
        showApplyDisabledCta={showApplyDisabledCta}
        applyNavDisabledCombined={applyNavDisabledCombined}
        applyNavBlockedBySeries={applyNavBlockedBySeries}
        applyBlockedCode={audition.applyBlockedCode}
        applyPolicyLoading={applyPolicyLoading}
        balanceLoading={balanceLoading}
        isMultiRoundAudition={isMultiRoundAudition}
        myApplicationIdForRound={myApplicationIdForRound}
        myCurrentRoundUuid={myCurrentRoundUuid}
        myApplicantRoundNumber={myApplicantRoundNumber}
        applyPolicySnapshot={applyPolicySnapshot}
        creditBalanceAmount={creditBalanceAmount}
        needCreditsForApply={needCreditsForApply}
        creditGateReady={creditGateReady}
        hasEnoughCredits={hasEnoughCredits}
        applyPolicyError={applyPolicyError}
      />
    </PageSurface>
  )
}
