'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { applicationApi } from '@/shared/api/applications'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { ApplicationRoundTimeline } from '@/components/application/ApplicationRoundTimeline'
import { MultiRoundSubmitCta } from '@/components/application/MultiRoundSubmitCta'
import { roundIdForRoundNumber } from '@/shared/audition/roundNav'
import { BasicInfoSection } from '@/components/my-application/BasicInfoSection'
import { VideoSection } from '@/components/my-application/VideoSection'
import { SnsSection } from '@/components/my-application/SnsSection'
import { IntroSection } from '@/components/my-application/IntroSection'
import { applicationStatusMessageKey } from '@/shared/i18n/applicationStatusKey'

function statusBadgeClass(status: string) {
  if (status === 'REVIEWING' || status === 'REVIEWED') return 'rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700'
  if (status === 'ACCEPTED') return 'rounded-full bg-green-50 px-3 py-1 text-sm text-green-700'
  return 'rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
}

function formatLocaleDate(iso: string, locale: string): string {
  const tag = locale.startsWith('ko') ? 'ko-KR' : locale.startsWith('mn') ? 'mn-MN' : 'en-US'
  return new Date(iso).toLocaleDateString(tag)
}

export default function MyApplicationDetailPage() {
  const t = useTranslations('common')
  const tMy = useTranslations('myApplications')
  const tStatus = useTranslations('status')
  const tApply = useTranslations('apply')
  const locale = useLocale()
  const params = useParams()
  const id = params.id as string

  const applicationQuery = useQuery({
    queryKey: ['my-application', id],
    queryFn: () => applicationApi.getById(id),
    enabled: !!id,
  })

  const statusLabel = (status: string) => {
    const key = applicationStatusMessageKey(status)
    return key ? tStatus(key) : status
  }

  if (applicationQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  }
  if (!applicationQuery.data) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
  }

  const app = applicationQuery.data
  const isMultiRound = app.processMode === 'MULTI_ROUND'
  const roundSummaries = app.roundSummaries ?? []
  const applicantRound = app.currentRoundNumber ?? 1
  const currentRoundId = roundIdForRoundNumber(roundSummaries, applicantRound)

  const videos = app.videos ?? []
  const canEditVideos = app.status !== 'ACCEPTED' && app.status !== 'REJECTED'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <Link href="/my/applications" className="text-sm font-medium text-[#3B82F6] no-underline">
          ← {tMy('backToList')}
        </Link>

        <section className={`${CARD_BASE} flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
          <div>
            <p className={`${TEXT_SUB} mb-1`}>{tMy('auditionInfo')}</p>
            <h1 className={TITLE_PAGE}>{app.auditionTitle ?? tMy('detailFallback')}</h1>
            <p className={`${TEXT_SUB} mt-1`}>
              {tMy('appliedOn', { date: formatLocaleDate(app.createdAt, locale) })}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <span className={`${statusBadgeClass(app.status)} text-center sm:text-right`}>
              {statusLabel(app.status)}
            </span>
            {canEditVideos ? (
              <Link href={`/my/applications/${id}/edit`} className={`${BTN_SECONDARY} no-underline`}>
                {tMy('editApply')}
              </Link>
            ) : (
              <p className="max-w-[220px] text-right text-xs text-neutral-500">{tMy('lockedHint')}</p>
            )}
          </div>
        </section>

        {isMultiRound ? (
          <>
            <ApplicationRoundTimeline
              applicationId={app.id}
              roundSummaries={roundSummaries}
              currentRoundNumber={applicantRound}
            />
            <div className={`${CARD_BASE} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
              <div>
                <h2 className={`${TITLE_PAGE} mb-1`}>{tMy('nextRoundSubmit')}</h2>
                <p className={TEXT_SUB}>{tMy('currentRoundHint', { n: applicantRound })}</p>
              </div>
              <div className="min-w-0 flex-1 sm:text-right">
                {currentRoundId ? (
                  <MultiRoundSubmitCta
                    applicationId={app.id}
                    auditionId={app.auditionId}
                    roundId={currentRoundId}
                    label={tApply('roundApplyCta', { n: applicantRound })}
                    className={`${BTN_PRIMARY} inline-flex justify-center text-center no-underline`}
                  />
                ) : (
                  <p className="text-sm text-amber-700">{tMy('roundMissing')}</p>
                )}
              </div>
            </div>
          </>
        ) : null}

        <div className={SECTION_GAP}>
          <h2 className={`${TITLE_PAGE} text-base text-neutral-800`}>{tMy('myInfo')}</h2>
          <BasicInfoSection
            name={app.name}
            birthDate={app.birthDate}
            age={app.age}
            nationality={app.nationality}
          />
          <VideoSection
            videos={videos.map((v) => ({
              id: v.id,
              title: v.title,
              videoUrl: v.videoUrl,
              thumbnailUrl: v.thumbnailUrl,
            }))}
          />
          <SnsSection snsLinks={app.snsLinks ?? []} />
          <IntroSection introText={app.introText} />
        </div>
      </div>
    </div>
  )
}
