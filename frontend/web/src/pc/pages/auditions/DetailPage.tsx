'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { AUDITION_DETAIL } from '@/shared/design-tokens'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '@/shared/utils/safe'
import { useAuthStore } from '@/shared/auth/authStore'
import { AuditionDetailHeroSection } from '@/components/audition/AuditionDetailHeroSection'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/shared/api/credits'
import { roundIdForRoundNumber } from '@/shared/audition/roundNav'
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

export default function PcAuditionDetailPage() {
  const params = useParams()
  const t = useTranslations('common')
  const id = params.id as string
  const accessToken = useAuthStore((s) => s.accessToken)
  const myUserId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    /** 로그인 전후 hasApplied 등 뷰어 전용 필드 반영 */
    queryKey: ['audition', id, myUserId ?? 'anon'],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  const isOpenAudition = audition?.status === 'OPEN'

  const { data: applyPolicy, isLoading: applyPolicyLoading, isError: applyPolicyError } = useQuery({
    queryKey: ['credit-policy-public', CREDIT_POLICY_AUDITION_APPLY],
    queryFn: () => creditsApi.getPublicPolicy(CREDIT_POLICY_AUDITION_APPLY),
    enabled: !!id && isOpenAudition,
    staleTime: 60_000,
  })

  const showApplySubmitCtaEarly =
    isOpenAudition && !!accessToken && (role === 'APPLICANT' || role === 'ADMIN')

  const { data: creditBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => creditsApi.getBalance(),
    enabled: !!id && showApplySubmitCtaEarly,
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: AUDITION_DETAIL.bodyFontPx }}>{t('loading')}</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: '#b91c1c' }}>{t('error')}</div>
      </div>
    )
  }

  const embed = getVideoEmbedSrc(safeStr(audition.videoUrl))
  const galleryRaw = safeArr(audition.galleryImages)
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
  const recruitList = safeArr(audition.recruitFields)
  const qualifications = safeArr(audition.qualifications)
  const schedules = safeArr(audition.schedules)
  const benefits = safeArr(audition.benefits)
  const auditionTags = safeArr(audition.tags)
  const seriesRound = audition.round ?? 1
  const headlineTitle = auditionHeadlineTitle(audition)
  const descriptionText = safeStr(audition.description)
  const heroSubtitle =
    descriptionText
      .split(/\n/)
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? ''
  const remainingDaysVal = safeNum(audition.remainingDays)
  const deadlineUrgent = isOpenAudition && remainingDaysVal <= 3 && remainingDaysVal >= 0

  const isOpen = audition.status === 'OPEN'
  const alreadyApplied = audition.hasApplied === true
  const isMultiRoundAudition = safeStr(audition.processMode) === 'MULTI_ROUND'
  const auditionRoundSummaries = audition.roundSummaries ?? []
  const myApplicationIdForRound = audition.myApplicationId
  const myApplicantRoundNumber = audition.myCurrentRoundNumber ?? 1
  const myCurrentRoundUuid: string | null =
    myApplicationIdForRound != null && myApplicationIdForRound.length > 0
      ? roundIdForRoundNumber(auditionRoundSummaries, myApplicantRoundNumber)
      : null
  /** 하단 CTA: 오픈 시 비로그인은 로그인 유도, 지원자/관리자만 실제 지원 버튼 */
  const isAuthenticated = !!accessToken
  const showApplyLoginCta = isOpen && !isAuthenticated
  const showApplySubmitCta = isOpen && isAuthenticated && (role === 'APPLICANT' || role === 'ADMIN')
  const showApplyDisabledCta = isOpen && isAuthenticated && !showApplySubmitCta

  const applyPolicySnapshot = applyPolicy
  const creditBalanceAmount = creditBalance?.balance ?? 0
  const needCreditsForApply =
    !!applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0
  const creditGateReady = !needCreditsForApply || !balanceLoading
  const hasEnoughCredits =
    !applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0
      ? true
      : creditBalanceAmount >= applyPolicySnapshot.cost
  const applyNavDisabledForCredits = Boolean(
    showApplySubmitCta &&
      !alreadyApplied &&
      (applyPolicyLoading ||
        applyPolicyError ||
        !applyPolicySnapshot ||
        !applyPolicySnapshot.active ||
        !creditGateReady ||
        !hasEnoughCredits)
  )

  const applyNavBlockedBySeries = Boolean(
    showApplySubmitCta &&
      !alreadyApplied &&
      seriesRound >= 2 &&
      audition.canApply === false
  )

  const applyNavDisabledCombined = applyNavDisabledForCredits || applyNavBlockedBySeries

  const fmt = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy.MM.dd', { locale: ko })
    } catch {
      return '-'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: AUDITION_DETAIL.pageBackgroundMuted }}>
      <AuditionDetailHeroSection
        auditionId={id}
        heroImageMediumUrl={heroMedium}
        heroImageOriginalUrl={heroOriginal}
        title={headlineTitle}
        status={String(audition.status)}
        statusPillText={audition.recruitmentRoundLabel}
        tags={auditionTags}
        endDateFormatted={fmt(safeStr(audition.endDate))}
        location={safeStr(audition.location)}
        subtitle={heroSubtitle}
        deadlineUrgent={deadlineUrgent}
      />

      {embed ? (
        <section className="mt-4 w-full">
          <h2
            className="mb-2 w-full text-lg font-semibold"
            style={{
              paddingLeft: 'max(1rem, env(safe-area-inset-left))',
              paddingRight: 'max(1rem, env(safe-area-inset-right))',
            }}
          >
            소개 영상
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

      <div
        className="w-full px-4 pb-[calc(120px+env(safe-area-inset-bottom))]"
        style={{ paddingTop: AUDITION_DETAIL.sectionGapPx }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
          style={{
            gap: AUDITION_DETAIL.mainGridGapPx,
          }}
        >
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
        </div>

        <PcAuditionBenefitsSection benefits={benefits} />
      </div>

      <PcAuditionDetailApplyBar
        auditionId={id}
        isOpen={isOpen}
        alreadyApplied={alreadyApplied}
        showApplySubmitCta={showApplySubmitCta}
        showApplyLoginCta={showApplyLoginCta}
        showApplyDisabledCta={showApplyDisabledCta}
        applyNavDisabledCombined={applyNavDisabledCombined}
        applyNavBlockedBySeries={applyNavBlockedBySeries}
        applyBlockedMessage={audition.applyBlockedMessage}
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
    </div>
  )
}
