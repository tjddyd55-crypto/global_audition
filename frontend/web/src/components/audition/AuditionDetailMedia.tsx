'use client'

import { useState } from 'react'
import { AUDITION_DETAIL } from '@/lib/design-tokens'
import AuditionGallery from '@/components/gallery/AuditionGallery'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/** 히어로 대표: 잘림 없음 — 베젤(#111) + contain + max 높이 */
export function AuditionDetailHeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    <div className="flex w-full justify-center bg-[#111] py-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="mx-auto h-auto w-full max-h-[60vh] object-contain"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

type AuditionDetailMediaProps = {
  /** 대표 URL 제외·중복 제거된 갤러리만 */
  galleryUrls: string[]
  /** 상세: 풀폭 그리드 / 기본: 슬라이더 */
  galleryLayout?: 'slider' | 'grid'
}

/**
 * 추가 이미지: 그리드(상세) 또는 슬라이더 + 풀스크린 뷰어.
 */
export function AuditionDetailMediaSection({
  galleryUrls,
  galleryLayout = 'grid',
}: AuditionDetailMediaProps) {
  if (galleryUrls.length === 0) {
    return null
  }

  return (
    <section className="w-full border-t border-neutral-200 bg-neutral-100">
      <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-6">
        <h2
          className="m-0"
          style={{
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          추가 이미지
        </h2>
      </div>
      <AuditionGallery images={galleryUrls} layout={galleryLayout} />
    </section>
  )
}
