'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '../../../../lib/api/auditions'
import { applicationApi } from '../../../../lib/api/applications'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Image from 'next/image'
import { AUDITION_DETAIL, HERO } from '../../../../lib/design-tokens'
import { getVideoEmbedSrc } from '../../../../lib/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '../../../../lib/utils/safe'
import { useAuthStore } from '@/lib/auth/authStore'
import { AuditionDetailHeroSection } from '@/components/audition/AuditionDetailHeroSection'
import { AuditionDetailMediaSection } from '@/components/audition/AuditionDetailMedia'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/lib/api/credits'
import { canManageAudition as userCanManageAudition } from '@/lib/audition/auditionPermissions'

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const id = params.id as string
  const [applyError, setApplyError] = useState<string | null>(null)
  /** 클릭 직후 즉시 비활성화 (네트워크 대기 전 이중 클릭 방지) */
  const [applyClickLock, setApplyClickLock] = useState(false)
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

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(id),
    onMutate: () => {
      setApplyClickLock(true)
      setApplyError(null)
    },
    onSuccess: () => {
      setApplyError(null)
      queryClient.invalidateQueries({ queryKey: ['audition', id] })
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
      router.push('/my/dashboard')
    },
    onError: (err: any) => {
      setApplyClickLock(false)
      const status = err.response?.status
      const serverMsg = err.response?.data?.message
      const msg =
        status === 409
          ? serverMsg || '이미 지원 완료입니다.'
          : serverMsg || err.message || '지원에 실패했습니다.'
      setApplyError(msg)
    },
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
  const cover = safeStr(audition.coverImage)
  /** 대표와 동일 URL 중복 제거 후 추가 이미지 */
  const galleryExtra = galleryRaw
    .map((src) => safeStr(src))
    .filter((s) => s.length > 0 && s !== cover)
    .slice(0, 24)
  const applicants = safeNum(audition.applicantsCount)
  const recruitList = safeArr(audition.recruitFields)
  const qualifications = safeArr(audition.qualifications)
  const schedules = safeArr(audition.schedules)
  const benefits = safeArr(audition.benefits)
  const auditionTags = safeArr(audition.tags)

  const isOpen = audition.status === 'OPEN'
  const alreadyApplied = audition.hasApplied === true
  /** 하단 CTA: 오픈 시 비로그인은 로그인 유도, 지원자/관리자만 실제 지원 버튼 */
  const showApplyLoginCta = isOpen && !accessToken
  const showApplySubmitCta = isOpen && accessToken && (role === 'APPLICANT' || role === 'ADMIN')
  const showApplyDisabledCta = isOpen && accessToken && !showApplySubmitCta
  const canManageAudition = userCanManageAudition({
    accessToken,
    userId: myUserId,
    ownerId: audition.ownerId,
    role,
  })

  const applyPolicySnapshot = applyPolicy
  const creditBalanceAmount = creditBalance?.balance ?? 0
  const needCreditsForApply =
    !!applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0
  const creditGateReady = !needCreditsForApply || !balanceLoading
  const hasEnoughCredits =
    !applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0
      ? true
      : creditBalanceAmount >= applyPolicySnapshot.cost
  const applyButtonDisabledForCredits = Boolean(
    showApplySubmitCta &&
      !alreadyApplied &&
      (applyClickLock ||
        applyMutation.isPending ||
        applyPolicyLoading ||
        applyPolicyError ||
        !applyPolicySnapshot ||
        !applyPolicySnapshot.active ||
        !creditGateReady ||
        !hasEnoughCredits)
  )

  const fmt = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy.MM.dd', { locale: ko })
    } catch {
      return '-'
    }
  }

  /** 하단 고정 CTA(모바일 2열 대비) 여백 */
  const container: React.CSSProperties = {
    maxWidth: AUDITION_DETAIL.containerMaxWidthPx,
    margin: '0 auto',
    paddingBottom: Math.max(AUDITION_DETAIL.fixedCtaHeightPx * 2, 120) + AUDITION_DETAIL.mainGridGapPx,
  }

  return (
    <div style={{ minHeight: '100vh', background: AUDITION_DETAIL.pageBackgroundMuted }}>
      <AuditionDetailHeroSection
        auditionId={id}
        coverUrl={cover}
        title={safeStr(audition.title)}
        status={String(audition.status)}
        tags={auditionTags}
        endDateFormatted={fmt(safeStr(audition.endDate))}
        location={safeStr(audition.location)}
        applicantsCount={applicants}
      />

      {embed ? (
        <section className="w-full border-t border-neutral-200">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
            <h2
              style={{
                margin: '0 0 12px 0',
                fontSize: AUDITION_DETAIL.sectionTitlePx,
                fontWeight: AUDITION_DETAIL.sectionTitleWeight,
              }}
            >
              소개 영상
            </h2>
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                borderRadius: AUDITION_DETAIL.videoRadiusPx,
                overflow: 'hidden',
                background: '#000',
              }}
            >
              <iframe
                title="audition-video"
                src={embed}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      ) : null}

      {galleryExtra.length > 0 ? <AuditionDetailMediaSection galleryUrls={galleryExtra} /> : null}

      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6" style={{ ...container, paddingTop: AUDITION_DETAIL.sectionGapPx }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
          style={{
            gap: AUDITION_DETAIL.mainGridGapPx,
          }}
        >
          <div>
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
              <p
                style={{
                  margin: '0 0 20px 0',
                  fontSize: AUDITION_DETAIL.bodyFontPx,
                  color: AUDITION_DETAIL.bodyColor,
                  lineHeight: 1.6,
                }}
              >
                {safeStr(audition.description)}
              </p>
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
                <div>지원자 {applicants.toLocaleString()}명</div>
                <div>남은 기간 D-{safeNum(audition.remainingDays)}</div>
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

        {applyError && (
          <div
            style={{
              marginTop: AUDITION_DETAIL.benefitGridGapPx,
              padding: AUDITION_DETAIL.benefitCardPaddingPx,
              borderRadius: AUDITION_DETAIL.videoRadiusPx,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: AUDITION_DETAIL.bodyFontPx,
            }}
          >
            {applyError}
          </div>
        )}

        {canManageAudition && (
          <div
            className="flex w-full max-w-md mx-auto flex-col gap-3 px-2 md:max-w-none md:flex-row md:justify-center md:px-0"
            style={{ marginTop: AUDITION_DETAIL.benefitGridGapPx, textAlign: 'center' }}
          >
            <Link
              href={`/auditions/${id}/edit`}
              className="inline-flex w-full md:w-auto items-center justify-center"
              style={{
                padding: '12px 24px',
                borderRadius: HERO.buttonRadiusPx,
                border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                color: '#111',
                fontWeight: 600,
                textDecoration: 'none',
                background: '#fff',
              }}
            >
              수정하기
            </Link>
            <Link
              href={`/auditions/${id}/applications`}
              className="inline-flex w-full md:w-auto items-center justify-center"
              style={{
                padding: '12px 24px',
                borderRadius: HERO.buttonRadiusPx,
                background: AUDITION_DETAIL.ownerLinkBg,
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              지원자 관리
            </Link>
          </div>
        )}
      </div>

      <div
        id="audition-detail-apply"
        tabIndex={-1}
        className="max-md:pb-[max(16px,env(safe-area-inset-bottom,0px))] scroll-mt-4 outline-none"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          background: '#fff',
          borderTop: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
          style={{ paddingLeft: AUDITION_DETAIL.fixedCtaPaddingPx, paddingRight: AUDITION_DETAIL.fixedCtaPaddingPx }}
        >
          <div className="flex w-full flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center md:w-auto">
            {showApplySubmitCta && alreadyApplied ? (
              <div className="flex w-full min-[480px]:w-auto flex-col gap-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full min-[480px]:w-auto cursor-not-allowed items-center justify-center px-6 font-semibold opacity-80"
                  style={{
                    borderRadius: HERO.buttonRadiusPx,
                    border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                    background: '#ecfdf5',
                    color: '#047857',
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                  }}
                >
                  지원 완료
                </button>
                <span className="text-center text-xs text-gray-500 min-[480px]:text-left">
                  이 오디션에 이미 지원하셨습니다.
                </span>
              </div>
            ) : showApplySubmitCta ? (
              <div className="flex w-full min-[480px]:w-auto flex-col gap-2">
                <button
                  type="button"
                  onClick={() => applyMutation.mutate()}
                  disabled={applyButtonDisabledForCredits}
                  className="inline-flex h-11 w-full min-[480px]:w-auto items-center justify-center px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    borderRadius: HERO.buttonRadiusPx,
                    border: 'none',
                    background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                  }}
                >
                  {applyMutation.isPending || applyClickLock
                    ? '처리 중...'
                    : applyPolicyLoading || balanceLoading
                      ? '확인 중...'
                      : '지원하기'}
                </button>
                {isOpen && applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0 ? (
                  <span className="text-center text-xs text-gray-500 min-[480px]:text-left">
                    지원 시 크레딧 {applyPolicySnapshot.cost} 소모 · 보유 {creditBalanceAmount}
                  </span>
                ) : null}
                {isOpen &&
                needCreditsForApply &&
                creditGateReady &&
                !hasEnoughCredits &&
                applyPolicySnapshot?.active ? (
                  <Link
                    href="/credits/charge"
                    className="inline-flex h-10 w-full min-[480px]:w-auto items-center justify-center rounded-lg border-2 border-violet-600 bg-white px-4 text-sm font-semibold text-violet-700 no-underline hover:bg-violet-50"
                  >
                    크레딧 충전하기
                  </Link>
                ) : null}
                {isOpen && applyPolicySnapshot && !applyPolicySnapshot.active ? (
                  <span className="text-center text-xs text-amber-700 min-[480px]:text-left">
                    지원 비용 정책이 비활성화되어 지원할 수 없습니다.
                  </span>
                ) : null}
                {isOpen && applyPolicyError ? (
                  <span className="text-center text-xs text-red-600 min-[480px]:text-left">
                    지원 비용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                  </span>
                ) : null}
              </div>
            ) : showApplyLoginCta ? (
              <Link
                href={`/login?next=${encodeURIComponent(`/auditions/${id}`)}`}
                className="inline-flex h-11 w-full min-[480px]:w-auto items-center justify-center px-6 font-semibold text-white no-underline"
                style={{
                  borderRadius: HERO.buttonRadiusPx,
                  background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                  fontSize: AUDITION_DETAIL.bodyFontPx,
                }}
              >
                지원하기
              </Link>
            ) : showApplyDisabledCta ? (
              <button
                type="button"
                disabled
                title="지원자 계정으로 로그인 후 이용할 수 있습니다."
                className="inline-flex h-11 w-full min-[480px]:w-auto cursor-not-allowed items-center justify-center px-6 font-semibold opacity-50"
                style={{
                  borderRadius: HERO.buttonRadiusPx,
                  border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                  background: '#f9fafb',
                  color: '#6b7280',
                  fontSize: AUDITION_DETAIL.bodyFontPx,
                }}
              >
                지원하기
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-11 w-full min-[480px]:w-auto cursor-not-allowed items-center justify-center px-6 font-semibold opacity-50"
                style={{
                  borderRadius: HERO.buttonRadiusPx,
                  border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
                  background: '#f9fafb',
                  color: '#6b7280',
                  fontSize: AUDITION_DETAIL.bodyFontPx,
                }}
              >
                마감됨
              </button>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:justify-end md:w-auto md:justify-end">
            <Link
              href={`/auditions/${id}/vote`}
              className="inline-flex h-11 w-full min-[480px]:min-w-[200px] items-center justify-center border font-semibold no-underline md:w-auto"
              style={{
                borderRadius: HERO.buttonRadiusPx,
                borderColor: AUDITION_DETAIL.cardBorderColor,
                background: '#fff',
                color: '#111',
                fontSize: AUDITION_DETAIL.bodyFontPx,
                paddingLeft: 20,
                paddingRight: 20,
              }}
            >
              지원자 보기 &amp; 투표
            </Link>
            {canManageAudition ? (
              <>
                <Link
                  href={`/auditions/${id}/ranking`}
                  className="inline-flex h-11 w-full min-[480px]:min-w-[120px] items-center justify-center border font-semibold no-underline md:w-auto"
                  style={{
                    borderRadius: HERO.buttonRadiusPx,
                    borderColor: AUDITION_DETAIL.cardBorderColor,
                    background: '#f5f3ff',
                    color: '#5b21b6',
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}
                >
                  랭킹
                </Link>
                <Link
                  href={`/auditions/${id}/manage`}
                  className="inline-flex h-11 w-full min-[480px]:min-w-[120px] items-center justify-center border font-semibold no-underline md:w-auto"
                  style={{
                    borderRadius: HERO.buttonRadiusPx,
                    borderColor: AUDITION_DETAIL.cardBorderColor,
                    background: '#fff',
                    color: '#111',
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}
                >
                  상태 관리
                </Link>
                <Link
                  href={`/auditions/${id}/applications`}
                  className="inline-flex h-11 w-full min-[480px]:min-w-[160px] items-center justify-center font-semibold text-white no-underline md:w-auto"
                  style={{
                    borderRadius: HERO.buttonRadiusPx,
                    background: AUDITION_DETAIL.ownerLinkBg,
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                    paddingLeft: 20,
                    paddingRight: 20,
                  }}
                >
                  지원자 관리
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
