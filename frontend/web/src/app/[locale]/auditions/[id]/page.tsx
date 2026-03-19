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
import { AUDITION_CARD, AUDITION_DETAIL, HERO } from '../../../../lib/design-tokens'
import { getVideoEmbedSrc } from '../../../../lib/utils/videoEmbed'
import { safeArr, safeNum, safeStr } from '../../../../lib/utils/safe'
import { useAuthStore } from '@/lib/auth/authStore'
import { AuditionGalleryViewer } from '@/components/audition/AuditionGalleryViewer'

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
  const accessToken = useAuthStore((s) => s.accessToken)
  const myUserId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply(id),
    onSuccess: () => {
      setApplyError(null)
      queryClient.invalidateQueries({ queryKey: ['audition', id] })
      router.push('/my/dashboard')
    },
    onError: (err: any) => {
      const msg =
        err.response?.status === 409
          ? '이미 지원하셨습니다.'
          : err.response?.data?.message || err.message || '지원에 실패했습니다.'
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
  const gallery = galleryRaw.filter((src) => safeStr(src).length > 0).slice(0, 12)
  const cover = safeStr(audition.coverImage)
  const applicants = safeNum(audition.applicantsCount)
  const recruitList = safeArr(audition.recruitFields)
  const qualifications = safeArr(audition.qualifications)
  const schedules = safeArr(audition.schedules)
  const benefits = safeArr(audition.benefits)

  const canApply = audition.status === 'OPEN' && (role === 'APPLICANT' || role === 'ADMIN')
  const canManageAudition =
    Boolean(accessToken) &&
    (myUserId === audition.ownerId || role === 'ADMIN' || role === 'AGENCY')

  const fmt = (iso: string) => {
    try {
      return format(new Date(iso), 'yyyy.MM.dd', { locale: ko })
    } catch {
      return '-'
    }
  }

  const container: React.CSSProperties = {
    maxWidth: AUDITION_DETAIL.containerMaxWidthPx,
    margin: '0 auto',
    paddingBottom: AUDITION_DETAIL.fixedCtaHeightPx + AUDITION_DETAIL.mainGridGapPx,
  }

  const cardBase: React.CSSProperties = {
    border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
    borderRadius: AUDITION_DETAIL.cardRadiusPx,
    padding: AUDITION_DETAIL.cardPaddingPx,
    background: '#fff',
  }

  const cardBaseClass = 'max-md:!p-4'

  return (
    <div style={{ minHeight: '100vh', background: AUDITION_DETAIL.pageBackgroundMuted }}>
      <section
        style={{
          position: 'relative',
          minHeight: 320,
          background: cover ? `url(${cover}) center/cover no-repeat` : `linear-gradient(135deg, ${HERO.gradientStart}, ${HERO.gradientEnd})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(${AUDITION_DETAIL.heroOverlayRgb},${AUDITION_DETAIL.heroOverlayOpacity})`,
          }}
        />
        <div
          className="mx-auto w-full max-w-[1200px] px-4 md:px-6"
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: AUDITION_DETAIL.sectionGapPx,
            paddingBottom: AUDITION_DETAIL.sectionGapPx,
            color: AUDITION_DETAIL.heroMetaColor,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: AUDITION_CARD.badgeFontSizePx,
              padding: `${AUDITION_CARD.badgePaddingY}px ${AUDITION_CARD.badgePaddingX}px`,
              borderRadius: AUDITION_CARD.badgeRadius,
              background: AUDITION_DETAIL.statusOpenBg,
              color: AUDITION_DETAIL.statusOpenColor,
              fontWeight: 600,
              marginBottom: AUDITION_DETAIL.heroBadgeMarginBottomPx,
            }}
          >
            {audition.status === 'OPEN' ? '모집중' : audition.status === 'CLOSED' ? '마감' : '초안'}
          </span>
          <h1
            style={{
              margin: '0 0 16px 0',
              fontSize: `clamp(${AUDITION_DETAIL.heroTitleMinPx}px, 4vw, ${AUDITION_DETAIL.heroTitlePx}px)`,
              fontWeight: AUDITION_DETAIL.heroTitleWeight,
              lineHeight: 1.3,
              color: '#fff',
            }}
          >
            {safeStr(audition.title)}
          </h1>
          <div
            style={{
              fontSize: AUDITION_DETAIL.heroMetaFontPx,
              display: 'flex',
              flexWrap: 'wrap',
              gap: AUDITION_DETAIL.heroMetaWrapGapPx,
            }}
          >
            <span>마감 {fmt(safeStr(audition.endDate))}</span>
            <span>{safeStr(audition.location)}</span>
            <span>지원자 {applicants.toLocaleString()}명</span>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6" style={{ ...container, paddingTop: AUDITION_DETAIL.sectionGapPx }}>
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px]"
          style={{
            gap: AUDITION_DETAIL.mainGridGapPx,
          }}
        >
          <div>
            {embed ? (
              <div className={cardBaseClass} style={{ ...cardBase, marginBottom: AUDITION_DETAIL.mainGridGapPx }}>
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
            ) : null}

            <div className={cardBaseClass} style={{ ...cardBase, marginBottom: AUDITION_DETAIL.mainGridGapPx }}>
              <h2
                style={{
                  margin: '0 0 12px 0',
                  fontSize: AUDITION_DETAIL.sectionTitlePx,
                  fontWeight: AUDITION_DETAIL.sectionTitleWeight,
                }}
              >
                갤러리
              </h2>
              {gallery.length > 0 ? (
                <AuditionGalleryViewer images={gallery} />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${AUDITION_DETAIL.galleryColumns}, 1fr)`,
                    gap: AUDITION_DETAIL.galleryGapPx,
                  }}
                >
                  {Array.from({ length: AUDITION_DETAIL.galleryPlaceholderCount }, (_, i) => (
                    <div
                      key={`gallery-ph-${i}`}
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        borderRadius: AUDITION_DETAIL.galleryRadiusPx,
                        overflow: 'hidden',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: AUDITION_DETAIL.metaMutedColor,
                        fontSize: AUDITION_DETAIL.metaMutedPx,
                      }}
                    >
                      —
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={cardBaseClass} style={cardBase}>
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
            </div>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: AUDITION_DETAIL.mainGridGapPx }}>
            <div className={cardBaseClass} style={cardBase}>
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
                      fontSize: 11,
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

            <div className={cardBaseClass} style={cardBase}>
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

            <div className={cardBaseClass} style={cardBase}>
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
          <div style={{ marginTop: AUDITION_DETAIL.sectionGapPx }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>혜택</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${AUDITION_DETAIL.benefitGridColumns}, 1fr)`,
                gap: AUDITION_DETAIL.benefitGridGapPx,
              }}
              className="max-md:grid-cols-1"
            >
              {benefits.map((b, i) => (
                <div
                  key={`b-${i}-${b.slice(0, 24)}`}
                  className={cardBaseClass}
                  style={{
                    ...cardBase,
                    padding: AUDITION_DETAIL.benefitCardPaddingPx,
                    fontSize: AUDITION_DETAIL.bodyFontPx,
                    color: AUDITION_DETAIL.bodyColor,
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
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

        {canApply && accessToken && (
          <div className="w-full max-w-md mx-auto px-2 md:px-0" style={{ marginTop: AUDITION_DETAIL.mainGridGapPx, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="w-full md:w-auto"
              style={{
                padding: '12px 32px',
                borderRadius: HERO.buttonRadiusPx,
                border: 'none',
                background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
                color: '#fff',
                fontWeight: 600,
                cursor: applyMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: applyMutation.isPending ? 0.7 : 1,
              }}
            >
              {applyMutation.isPending ? '처리 중...' : '지원하기'}
            </button>
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
              href={`/my/auditions/${id}/applications`}
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
              지원자 목록
            </Link>
          </div>
        )}
      </div>

      {!accessToken && (
        <div
          className="max-md:flex-col max-md:justify-center max-md:gap-3 max-md:py-3 max-md:h-auto"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            height: AUDITION_DETAIL.fixedCtaHeightPx,
            padding: `0 ${AUDITION_DETAIL.fixedCtaPaddingPx}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: AUDITION_DETAIL.benefitGridGapPx,
            background: '#fff',
            borderTop: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <span
            className="max-md:w-full max-md:text-center"
            style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: AUDITION_DETAIL.bodyColor }}
          >
            로그인 후 지원 가능
          </span>
          <Link
            href="/login"
            className="max-md:w-full max-md:justify-center"
            style={{
              flexShrink: 0,
              height: 44,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: HERO.buttonRadiusPx,
              background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
              color: '#fff',
              fontWeight: 500,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            로그인
          </Link>
        </div>
      )}
    </div>
  )
}
