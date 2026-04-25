'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '@/i18n.config'
import { useTranslations } from 'next-intl'
import { AUDITION_DETAIL } from '@/shared/design-tokens'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '@/shared/utils/safe'
import { useAuthStore } from '@/shared/auth/authStore'
import { AuditionDetailHeroSection } from '@/components/audition/AuditionDetailHeroSection'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/shared/api/credits'
import { MultiRoundSubmitCta } from '@/components/application/MultiRoundSubmitCta'
import { roundIdForRoundNumber } from '@/shared/audition/roundNav'
import PcAuditionDetailInfo from './components/PcAuditionDetailInfo'
import PcAuditionBenefitsSection from './components/PcAuditionBenefitsSection'
import PcAuditionDetailSidebar from './components/PcAuditionDetailSidebar'
import {
  auditionDetailMediumUrl,
  auditionDetailOriginalUrl,
  auditionHeadlineTitle,
  normalizeAuditionImages,
  PREV_ROUND_APPLY_BLOCKED_MSG,
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
  const showApplyLoginCta = isOpen && !accessToken
  const showApplySubmitCta = isOpen && accessToken && (role === 'APPLICANT' || role === 'ADMIN')
  const showApplyDisabledCta = isOpen && accessToken && !showApplySubmitCta

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

  const mainCtaClass =
    'flex w-full min-h-12 items-center justify-center rounded-lg bg-black py-4 text-center text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
  const mainCtaFullWidthClass =
    'flex min-h-12 w-full items-center justify-center rounded-lg bg-black py-4 text-center text-lg font-semibold text-white'
  const subCtaClass =
    'inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-900 sm:text-base'

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

      <div
        id="audition-detail-apply"
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] outline-none"
      >
        <div className="flex flex-col gap-2">
          {showApplySubmitCta && alreadyApplied ? (
            <button type="button" disabled className={mainCtaClass}>
              지금 지원하기
            </button>
          ) : !isOpen ? (
            <button type="button" disabled className={mainCtaClass}>
              지금 지원하기
            </button>
          ) : showApplySubmitCta ? (
            applyNavDisabledCombined ? (
              <button
                type="button"
                disabled
                title={
                  applyNavBlockedBySeries
                    ? (audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG)
                    : undefined
                }
                className={mainCtaClass}
              >
                {applyPolicyLoading || balanceLoading ? '확인 중...' : '지금 지원하기'}
              </button>
            ) : (
              <Link href={`/auditions/${id}/apply`} className={`${mainCtaClass} no-underline`}>
                지금 지원하기
              </Link>
            )
          ) : showApplyLoginCta ? (
            <Link
              href={`/login?next=${encodeURIComponent(`/auditions/${id}`)}`}
              className={`${mainCtaClass} no-underline`}
            >
              지금 지원하기
            </Link>
          ) : showApplyDisabledCta ? (
            <button
              type="button"
              disabled
              title="지원자 계정으로 로그인 후 이용할 수 있습니다."
              className={mainCtaClass}
            >
              지금 지원하기
            </button>
          ) : (
            <button type="button" disabled className={mainCtaClass}>
              지금 지원하기
            </button>
          )}

          {(showApplySubmitCta && alreadyApplied) || !isOpen ? (
            <div className="flex flex-wrap gap-2">
              {showApplySubmitCta && alreadyApplied ? (
                <Link href={`/auditions/${id}/vote`} className={`${subCtaClass} no-underline`}>
                  지원자 보기 &amp; 투표
                </Link>
              ) : null}
              {!isOpen ? (
                <Link href={`/auditions/${id}/ranking`} className={`${subCtaClass} no-underline`}>
                  랭킹 보기
                </Link>
              ) : null}
            </div>
          ) : null}

        {showApplySubmitCta && alreadyApplied ? (
          <p className="mt-2 text-center text-xs text-neutral-500">이 오디션에 이미 지원하셨습니다.</p>
        ) : null}

        {showApplySubmitCta && alreadyApplied && isMultiRoundAudition && myApplicationIdForRound ? (
          myCurrentRoundUuid ? (
            <div className="mt-2">
              <MultiRoundSubmitCta
                applicationId={myApplicationIdForRound}
                auditionId={id}
                roundId={myCurrentRoundUuid}
                label={`${myApplicantRoundNumber}차 지원하기`}
                className={`${mainCtaFullWidthClass} no-underline`}
              />
            </div>
          ) : (
            <p className="mt-2 text-center text-xs text-amber-700">
              라운드 정보를 불러오지 못했습니다. 내 지원서 상세에서 다시 시도해 주세요.
            </p>
          )
        ) : null}

        {isOpen && showApplySubmitCta && !alreadyApplied ? (
          <div className="mt-2 space-y-1 text-xs">
            {applyNavBlockedBySeries ? (
              <p className="text-center text-amber-800">{audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}</p>
            ) : null}
            {applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0 ? (
              <p className="text-center text-neutral-500">
                지원 시 크레딧 {applyPolicySnapshot.cost} 소모 · 보유 {creditBalanceAmount}
              </p>
            ) : null}
            {needCreditsForApply && creditGateReady && !hasEnoughCredits && applyPolicySnapshot?.active ? (
              <Link
                href="/credits/charge"
                className="flex min-h-10 items-center justify-center rounded-lg border-2 border-violet-600 bg-white text-sm font-semibold text-violet-700 no-underline hover:bg-violet-50"
              >
                크레딧 충전하기
              </Link>
            ) : null}
            {applyPolicySnapshot && !applyPolicySnapshot.active ? (
              <p className="text-center text-amber-700">지원 비용 정책이 비활성화되어 지원할 수 없습니다.</p>
            ) : null}
            {applyPolicyError ? (
              <p className="text-center text-red-600">지원 비용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : null}
          </div>
        ) : null}
        </div>
      </div>
    </div>
  )
}
