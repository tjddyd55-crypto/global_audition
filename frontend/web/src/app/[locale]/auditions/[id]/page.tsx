'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '../../../../lib/api/auditions'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { AUDITION_DETAIL, HERO } from '../../../../lib/design-tokens'
import { getVideoEmbedSrc } from '../../../../lib/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '../../../../lib/utils/safe'
import { useAuthStore } from '@/lib/auth/authStore'
import { AuditionDetailHeroSection } from '@/components/audition/AuditionDetailHeroSection'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/lib/api/credits'
import { MultiRoundSubmitCta } from '@/components/application/MultiRoundSubmitCta'
import { roundIdForRoundNumber } from '@/lib/audition/roundNav'
import { toast } from 'sonner'
import {
  auditionDetailMediumUrl,
  auditionDetailOriginalUrl,
  auditionHeadlineTitle,
  normalizeAuditionImages,
  PREV_ROUND_APPLY_BLOCKED_MSG,
} from '@/lib/types/audition'

function SectionBlock({
  iconLabel,
  title,
  items,
}: {
  iconLabel: string
  title: string
  items: string[]
}) {
  const list = safeArr(items)
    .map((s) => safeStr(s))
    .filter((s) => s.length > 0)
  return (
    <div style={{ marginBottom: AUDITION_DETAIL.sectionGapPx }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: AUDITION_DETAIL.sectionHeaderRowGapPx,
          marginBottom: AUDITION_DETAIL.sectionTitleBelowRowPx,
        }}
      >
        <span
          style={{
            width: AUDITION_DETAIL.sectionIconBoxPx,
            height: AUDITION_DETAIL.sectionIconBoxPx,
            borderRadius: AUDITION_DETAIL.videoRadiusPx,
            background: HERO.gradientStart,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: AUDITION_DETAIL.metaMutedPx,
            fontWeight: 700,
            color: HERO.primaryGradientStart,
          }}
        >
          {iconLabel}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
            color: '#111',
          }}
        >
          {title}
        </h3>
      </div>
      {list.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: AUDITION_DETAIL.listIndentPx,
            color: AUDITION_DETAIL.bodyColor,
            fontSize: AUDITION_DETAIL.listItemFontPx,
            lineHeight: AUDITION_DETAIL.listItemLineHeight,
          }}
        >
          {list.map((line, i) => (
            <li key={`${title}-${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            color: AUDITION_DETAIL.metaMutedColor,
            fontSize: AUDITION_DETAIL.metaMutedPx,
            lineHeight: AUDITION_DETAIL.listItemLineHeight,
          }}
        >
          정보 없음
        </p>
      )}
    </div>
  )
}

export default function AuditionDetailPage() {
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

  const shareAudition = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: headlineTitle, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('링크가 복사되었습니다.')
    } catch (e) {
      const err = e as { name?: string }
      if (err?.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        toast.success('링크가 복사되었습니다.')
      } catch {
        toast.error('공유에 실패했습니다.')
      }
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
        disableHeroApply={applyNavBlockedBySeries}
        heroApplyDisabledReason={audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}
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
          <div>
            {descriptionText.length > 0 ? (
              <section className="border-t border-neutral-200 py-6">
                <h2
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: AUDITION_DETAIL.sectionTitlePx,
                    fontWeight: AUDITION_DETAIL.sectionTitleWeight,
                  }}
                >
                  상세 설명
                </h2>
                <p
                  className="whitespace-pre-line"
                  style={{
                    margin: 0,
                    color: AUDITION_DETAIL.bodyColor,
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                    lineHeight: AUDITION_DETAIL.listItemLineHeight,
                  }}
                >
                  {descriptionText}
                </p>
                <div className="mt-6 text-sm text-gray-600">
                  지원 방법: 영상 업로드 후 간단 정보 입력
                </div>
              </section>
            ) : null}
            <section className="border-t border-neutral-200 py-6">
              <h2
                style={{
                  margin: '0 0 16px 0',
                  fontSize: AUDITION_DETAIL.sectionTitlePx,
                  fontWeight: AUDITION_DETAIL.sectionTitleWeight,
                }}
              >
                상세 안내
              </h2>
              {descriptionText.length === 0 ? (
                <div className="mb-6 text-sm text-gray-600">
                  지원 방법: 영상 업로드 후 간단 정보 입력
                </div>
              ) : null}
              <SectionBlock iconLabel="R" title="모집 분야" items={recruitList} />
              <SectionBlock iconLabel="Q" title="지원 자격" items={qualifications} />
              <SectionBlock iconLabel="S" title="일정" items={schedules} />
            </section>
          </div>

          <aside className="flex flex-col">
            <div className="border-t border-neutral-200 px-0 py-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: AUDITION_DETAIL.mainGridGapPx }}>
                <div
                  style={{
                    position: 'relative',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#f3f4f6',
                    flexShrink: 0,
                  }}
                >
                  {audition.agencyLogo ? (
                    <Image src={safeStr(audition.agencyLogo)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : null}
                </div>
                <div>
                  <div style={{ fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: 600 }}>
                    {safeStr(audition.agencyName) || '기획사'}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: AUDITION_DETAIL.galleryGapPx,
                      fontSize: AUDITION_DETAIL.bodyFontPx,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: AUDITION_DETAIL.verifiedBadgeBg,
                      color: AUDITION_DETAIL.verifiedBadgeColor,
                      fontWeight: 600,
                    }}
                  >
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 px-0 py-4">
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: AUDITION_DETAIL.sectionTitlePx,
                  fontWeight: AUDITION_DETAIL.sectionTitleWeight,
                }}
              >
                통계
              </h3>
              <div
                style={{
                  fontSize: AUDITION_DETAIL.bodyFontPx,
                  color: AUDITION_DETAIL.bodyColor,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: AUDITION_DETAIL.galleryGapPx,
                }}
              >
                <div>남은 기간 D-{remainingDaysVal}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: AUDITION_DETAIL.galleryGapPx, marginTop: AUDITION_DETAIL.galleryGapPx }}>
                  {recruitList.map((tag, idx) => (
                    <span
                      key={`tag-${idx}-${tag.slice(0, 20)}`}
                      style={{
                        fontSize: AUDITION_DETAIL.metaMutedPx,
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                        color: '#444',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 px-0 py-4">
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: AUDITION_DETAIL.sectionTitlePx,
                  fontWeight: AUDITION_DETAIL.sectionTitleWeight,
                }}
              >
                빠른 정보
              </h3>
              <dl style={{ margin: 0, fontSize: AUDITION_DETAIL.metaMutedPx, color: AUDITION_DETAIL.metaMutedColor }}>
                <dt style={{ marginTop: AUDITION_DETAIL.galleryGapPx, fontWeight: 600, color: '#333' }}>등록일</dt>
                <dd style={{ margin: '4px 0 0 0' }}>{fmt(safeStr(audition.createdAt))}</dd>
                <dt style={{ marginTop: AUDITION_DETAIL.benefitGridGapPx, fontWeight: 600, color: '#333' }}>마감일</dt>
                <dd style={{ margin: '4px 0 0 0' }}>{fmt(safeStr(audition.endDate))}</dd>
                <dt style={{ marginTop: AUDITION_DETAIL.benefitGridGapPx, fontWeight: 600, color: '#333' }}>위치</dt>
                <dd style={{ margin: '4px 0 0 0' }}>{safeStr(audition.location)}</dd>
              </dl>
            </div>
          </aside>
        </div>

        {benefits.length > 0 && (
          <section className="border-t border-neutral-200 py-6" style={{ marginTop: AUDITION_DETAIL.sectionGapPx }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>혜택</h2>
            <div className="flex flex-col divide-y divide-neutral-200">
              {benefits.map((b, i) => (
                <div
                  key={`b-${i}-${b.slice(0, 24)}`}
                  style={{
                    padding: AUDITION_DETAIL.benefitCardPaddingPx,
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                    color: AUDITION_DETAIL.bodyColor,
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          {showApplySubmitCta && alreadyApplied ? (
            <button type="button" disabled className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60">
              지금 지원하기
            </button>
          ) : !isOpen ? (
            <button type="button" disabled className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60">
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
                className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applyPolicyLoading || balanceLoading ? '확인 중...' : '지금 지원하기'}
              </button>
            ) : (
              <Link href={`/auditions/${id}/apply`} className="block w-full no-underline">
                <span className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-lg font-semibold text-white">
                  지금 지원하기
                </span>
              </Link>
            )
          ) : showApplyLoginCta ? (
            <Link
              href={`/login?next=${encodeURIComponent(`/auditions/${id}`)}`}
              className="block w-full no-underline"
            >
              <span className="flex w-full items-center justify-center rounded-lg bg-black py-4 text-lg font-semibold text-white">
                지금 지원하기
              </span>
            </Link>
          ) : showApplyDisabledCta ? (
            <button
              type="button"
              disabled
              title="지원자 계정으로 로그인 후 이용할 수 있습니다."
              className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60"
            >
              지금 지원하기
            </button>
          ) : (
            <button type="button" disabled className="w-full rounded-lg bg-black py-4 text-lg font-semibold text-white opacity-60">
              지금 지원하기
            </button>
          )}
        </div>
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
            {isOpen &&
            (showApplyLoginCta ||
              (showApplySubmitCta && !alreadyApplied) ||
              showApplyDisabledCta) ? (
              <button type="button" className={subCtaClass} onClick={() => void shareAudition()}>
                공유
              </button>
            ) : null}
          </div>

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
