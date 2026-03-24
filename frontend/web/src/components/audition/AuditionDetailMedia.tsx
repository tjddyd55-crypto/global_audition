'use client'

import { useState } from 'react'
import AuditionGallery from '@/components/gallery/AuditionGallery'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/**
 * 모바일 히어로: 잘림 없음 — bg-white + contain + max 높이.
 */
export function AuditionDetailHeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    <div className="flex w-full justify-center bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="mx-auto block h-auto w-full max-h-[65vh] object-contain"
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
}

/** 히어로와 추가 이미지 사이 시각 구분 + 세로 스택 갤러리(잘림 없음) */
export function AuditionDetailMediaSection({ galleryUrls }: AuditionDetailMediaProps) {
  if (galleryUrls.length === 0) {
    return null
  }

  return (
    <section className="w-full">
      <div className="my-4 h-2 w-full bg-gray-100" aria-hidden />
      <AuditionGallery images={galleryUrls} />
    </section>
  )
}
