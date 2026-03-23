'use client'

import { useState } from 'react'
import { AUDITION_DETAIL } from '@/lib/design-tokens'
import { AuditionGalleryViewer } from '@/components/audition/AuditionGalleryViewer'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/** 히어로 16:9 — S3 URL 깨짐 시 플레이스홀더 */
export function AuditionDetailHeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

type AuditionDetailMediaProps = {
  coverUrl: string
  /** 대표와 동일 URL은 제외한 갤러리 목록 */
  galleryUrls: string[]
}

function CoverFigure({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false)
  const url = !src || failed ? AUDITION_COVER_PLACEHOLDER_SRC : src

  return (
    <figure className="m-0">
      <figcaption
        className="mb-2 font-semibold text-gray-900"
        style={{ fontSize: AUDITION_DETAIL.sectionTitlePx - 2 }}
      >
        {label}
      </figcaption>
      <div
        className="relative w-full overflow-hidden rounded-[10px] border border-gray-200 bg-gray-100"
        style={{ aspectRatio: '16 / 9', maxHeight: 360 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    </figure>
  )
}

/**
 * 상세 본문: 대표 이미지 + 추가 이미지(갤러리) — 히어로와 데이터 동일 SSOT(URL)
 */
export function AuditionDetailMediaSection({ coverUrl, galleryUrls }: AuditionDetailMediaProps) {
  const hasCover = coverUrl.trim().length > 0
  const hasGallery = galleryUrls.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h2
          className="m-0 mb-3"
          style={{
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          이미지
        </h2>
        <p className="m-0 mb-4 text-sm text-gray-500">등록 시 업로드한 대표 이미지와 추가 이미지입니다.</p>
        {hasCover ? (
          <CoverFigure src={coverUrl} label="대표 이미지" />
        ) : (
          <p className="m-0 text-sm text-gray-500">등록된 대표 이미지가 없습니다.</p>
        )}
      </div>

      <div>
        <h3
          className="m-0 mb-3"
          style={{
            fontSize: AUDITION_DETAIL.sectionTitlePx - 2,
            fontWeight: 600,
          }}
        >
          추가 이미지
        </h3>
        {hasGallery ? (
          <AuditionGalleryViewer images={galleryUrls} />
        ) : (
          <p className="m-0 text-sm text-gray-500">추가 등록된 이미지가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
