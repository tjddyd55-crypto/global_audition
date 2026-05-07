'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AgencyBoardStatus, ApplicationAgencyDetail } from '@/shared/api/auditions'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import {
  ApplicantDetailActionBar,
  ApplicantDetailBasicInfo,
  ApplicantDetailIntroSection,
  ApplicantDetailPanelHeader,
  ApplicantDetailPanelState,
  ApplicantDetailSnsSection,
  ApplicantDetailVideoSection,
  ApplicantStatusConfirmDialog,
} from '@/components/audition/manage/detail'

type AgencyDetailPanelProps = {
  applicationId: string
  detail: ApplicationAgencyDetail | undefined
  isLoading: boolean
  isError: boolean
  onClose: () => void
  patchingId: string | null
  onPatch: (id: string, status: AgencyBoardStatus) => void
}

export default function AgencyDetailPanel({
  applicationId,
  detail,
  isLoading,
  isError,
  onClose,
  patchingId,
  onPatch,
}: AgencyDetailPanelProps) {
  const [confirmStatus, setConfirmStatus] = useState<AgencyBoardStatus | null>(null)
  const patching = patchingId === applicationId

  const embed = detail?.videoUrl ? getVideoEmbedSrc(detail.videoUrl) : ''
  const detailThumb = detail ? resolveVideoThumbnailUrl(detail.videoUrl ?? '', detail.thumbnailUrl ?? null) : null

  const birth = detail?.birthDate
    ? (() => {
        try {
          return format(new Date(detail.birthDate!), 'yyyy-MM-dd', { locale: ko })
        } catch {
          return detail.birthDate
        }
      })()
    : '—'

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        aria-label="패널 닫기"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <ApplicantDetailPanelHeader onClose={onClose} />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? <ApplicantDetailPanelState message="불러오는 중…" /> : null}
          {isError ? <ApplicantDetailPanelState message="상세를 불러오지 못했습니다." tone="danger" /> : null}
          {detail && (
            <div className="flex flex-col gap-6">
              <ApplicantDetailVideoSection
                videoUrl={detail.videoUrl}
                embedUrl={embed}
                thumbnailUrl={detailThumb}
              />
              <ApplicantDetailBasicInfo detail={detail} birthLabel={birth} />
              <ApplicantDetailSnsSection snsLinks={detail.snsLinks} />
              <ApplicantDetailIntroSection introText={detail.introText} />
            </div>
          )}
        </div>

        {detail ? (
          <ApplicantDetailActionBar
            currentStatus={detail.status}
            patching={patching}
            onRequestStatusChange={setConfirmStatus}
          />
        ) : null}
      </aside>
      {confirmStatus != null ? (
        <ApplicantStatusConfirmDialog
          status={confirmStatus}
          patching={patching}
          onCancel={() => setConfirmStatus(null)}
          onConfirm={() => {
            onPatch(applicationId, confirmStatus)
            setConfirmStatus(null)
          }}
        />
      ) : null}
    </>
  )
}
