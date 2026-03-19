'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '../../../../lib/api/auditions'
import { applicationApi } from '../../../../lib/api/applications'
import { authApi } from '../../../../lib/api/auth'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Link } from '../../../../i18n.config'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Image from 'next/image'
import { AUDITION_CARD, AUDITION_DETAIL, HERO } from '../../../../lib/design-tokens'
import { getVideoEmbedSrc } from '../../../../lib/utils/videoEmbed'
import type { AuditionDetailContent } from '../../../../lib/types/audition'

function SectionBlock({
  iconLabel,
  title,
  items,
}: {
  iconLabel: string
  title: string
  items: string[]
}) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: AUDITION_DETAIL.sectionGapPx }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: HERO.gradientStart,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
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
      <ul style={{ margin: 0, paddingLeft: 20, color: AUDITION_DETAIL.bodyColor, fontSize: AUDITION_DETAIL.listItemFontPx, lineHeight: AUDITION_DETAIL.listItemLineHeight }}>
        {items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
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
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
  const token = typeof window !== 'undefined' ? authApi.getToken() : null

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
        <div style={{ fontSize: 16 }}>{t('loading')}</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#b91c1c' }}>{t('error')}</div>
      </div>
    )
  }

  const dc: AuditionDetailContent = audition.detailContent
  const embed = getVideoEmbedSrc(audition.videoUrl ?? '')
  const gallery = (audition.galleryImages ?? []).slice(0, 3)
  const cover = audition.coverImage?.trim() || ''
  const canApply = audition.status === 'OPEN' && (role === 'APPLICANT' || role === 'ADMIN')
  const isOwner = role === 'AGENCY' || role === 'ADMIN'

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
    padding: `0 ${AUDITION_DETAIL.containerPaddingPx}px`,
    paddingBottom: AUDITION_DETAIL.fixedCtaHeightPx + 32,
  }

  const cardBase: React.CSSProperties = {
    border: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
    borderRadius: AUDITION_DETAIL.cardRadiusPx,
    padding: AUDITION_DETAIL.cardPaddingPx,
    background: '#fff',
  }

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
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: AUDITION_DETAIL.containerMaxWidthPx,
            margin: '0 auto',
            padding: `${AUDITION_DETAIL.sectionGapPx}px ${AUDITION_DETAIL.containerPaddingPx}px`,
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
              marginBottom: 12,
            }}
          >
            {audition.status === 'OPEN' ? '모집중' : audition.status === 'CLOSED' ? '마감' : '초안'}
          </span>
          <h1
            style={{
              margin: '0 0 16px 0',
              fontSize: AUDITION_DETAIL.heroTitlePx,
              fontWeight: AUDITION_DETAIL.heroTitleWeight,
              lineHeight: 1.3,
              color: '#fff',
            }}
          >
            {audition.title}
          </h1>
          <div style={{ fontSize: AUDITION_DETAIL.heroMetaFontPx, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <span>마감 {fmt(audition.endDate)}</span>
            <span>{audition.location}</span>
            <span>지원자 {audition.applicantsCount.toLocaleString()}명</span>
          </div>
        </div>
      </section>

      <div style={{ ...container, paddingTop: AUDITION_DETAIL.sectionGapPx }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: AUDITION_DETAIL.mainGridGapPx,
          }}
          className="max-lg:grid-cols-1"
        >
          <div>
            <div style={{ ...cardBase, marginBottom: AUDITION_DETAIL.mainGridGapPx }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: AUDITION_DETAIL.sectionTitleWeight }}>소개 영상</h2>
              {embed ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: AUDITION_DETAIL.videoRadiusPx, overflow: 'hidden' }}>
                  <iframe
                    title="audition-video"
                    src={embed}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: 200,
                    borderRadius: AUDITION_DETAIL.videoRadiusPx,
                    background: '#eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: AUDITION_DETAIL.metaMutedColor,
                    fontSize: AUDITION_DETAIL.metaMutedPx,
                  }}
                >
                  등록된 영상이 없습니다
                </div>
              )}
            </div>

            {gallery.length > 0 && (
              <div style={{ ...cardBase, marginBottom: AUDITION_DETAIL.mainGridGapPx }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: AUDITION_DETAIL.sectionTitleWeight }}>갤러리</h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${AUDITION_DETAIL.galleryColumns}, 1fr)`,
                    gap: AUDITION_DETAIL.galleryGapPx,
                  }}
                >
                  {gallery.map((src, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: AUDITION_DETAIL.galleryRadiusPx, overflow: 'hidden' }}>
                      <Image src={src} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={cardBase}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: AUDITION_DETAIL.sectionTitleWeight }}>상세 안내</h2>
              <p style={{ margin: '0 0 20px 0', fontSize: AUDITION_DETAIL.bodyFontPx, color: AUDITION_DETAIL.bodyColor, lineHeight: 1.6 }}>{audition.description}</p>
              <SectionBlock iconLabel="R" title="모집 분야" items={dc.recruit.length ? dc.recruit : audition.recruitFields} />
              <SectionBlock iconLabel="Q" title="지원 자격" items={dc.qualification} />
              <SectionBlock iconLabel="S" title="일정" items={dc.schedule} />
              <SectionBlock iconLabel="B" title="혜택 (상세)" items={dc.benefits} />
            </div>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: AUDITION_DETAIL.mainGridGapPx }}>
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                  {audition.agencyLogo ? (
                    <Image src={audition.agencyLogo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : null}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{audition.agencyName || '기획사'}</div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
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

            <div style={cardBase}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: AUDITION_DETAIL.sectionTitleWeight }}>통계</h3>
              <div style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: AUDITION_DETAIL.bodyColor, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>지원자 {audition.applicantsCount.toLocaleString()}명</div>
                <div>남은 기간 D-{audition.remainingDays}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {(audition.recruitFields.length ? audition.recruitFields : dc.recruit).map((tag) => (
                    <span
                      key={tag}
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

            <div style={cardBase}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: AUDITION_DETAIL.sectionTitlePx, fontWeight: AUDITION_DETAIL.sectionTitleWeight }}>빠른 정보</h3>
              <dl style={{ margin: 0, fontSize: AUDITION_DETAIL.metaMutedPx, color: AUDITION_DETAIL.metaMutedColor }}>
                <dt style={{ marginTop: 8, fontWeight: 600, color: '#333' }}>등록일</dt>
                <dd style={{ margin: '4px 0 0 0' }}>{fmt(audition.createdAt)}</dd>
                <dt style={{ marginTop: 12, fontWeight: 600, color: '#333' }}>마감일</dt>
                <dd style={{ margin: '4px 0 0 0' }}>{fmt(audition.endDate)}</dd>
                <dt style={{ marginTop: 12, fontWeight: 600, color: '#333' }}>위치</dt>
                <dd style={{ margin: '4px 0 0 0' }}>{audition.location}</dd>
              </dl>
            </div>
          </aside>
        </div>

        {(audition.benefits ?? []).length > 0 && (
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
              {audition.benefits.map((b, i) => (
                <div
                  key={i}
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
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: 14 }}>
            {applyError}
          </div>
        )}

        {canApply && token && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
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
        {isOwner && token && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link
              href={`/my/auditions/${id}/applications`}
              style={{
                display: 'inline-block',
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

      {!token && (
        <div
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
            gap: 16,
            background: '#fff',
            borderTop: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <span style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: AUDITION_DETAIL.bodyColor }}>로그인 후 지원 가능</span>
          <Link
            href="/login"
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
