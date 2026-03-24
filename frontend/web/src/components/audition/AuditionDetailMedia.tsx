'use client'

import { useState } from 'react'
import AuditionGallery from '@/components/gallery/AuditionGallery'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/**
 * 모바일 히어로용 배경 이미지.
 * 부모에 `relative h-[50vh] overflow-hidden` 필수.
 */
export function AuditionDetailHeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="absolute inset-0 h-full w-full object-cover object-center"
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

type AuditionDetailMediaProps = {
  /** 대표 URL 제외·중복 제거된 갤러리만 */
  galleryUrls: string[]
}

/** 추가 이미지: 풀폭 슬라이더(1장) + 탭 시 풀스크린 뷰어 */
export function AuditionDetailMediaSection({ galleryUrls }: AuditionDetailMediaProps) {
  if (galleryUrls.length === 0) {
    return null
  }

  return (
    <section className="w-full">
      <AuditionGallery images={galleryUrls} />
    </section>
  )
}
