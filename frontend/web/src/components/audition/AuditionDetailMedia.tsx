'use client'

import { useState } from 'react'
import AuditionGallery from '@/components/gallery/AuditionGallery'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/**
 * 풀폭 이미지(원본 비율). `fullSizeHref` 가 있으면 탭으로 원본 열기.
 */
export function AuditionDetailHeroImage({ src, fullSizeHref }: { src: string; fullSizeHref?: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed
  const href = (fullSizeHref?.trim() || trimmed).trim()

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="block h-auto w-full max-w-full object-cover"
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )

  return (
    <div className="relative w-full overflow-hidden bg-neutral-200">
      {href && !failed && url !== AUDITION_COVER_PLACEHOLDER_SRC ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  )
}

type AuditionDetailMediaProps = {
  /** 대표 URL 제외·중복 제거된 갤러리만 */
  galleryUrls: string[]
}

/** 풀폭 가로 스크롤 갤러리(히어로·소개 영상과 동일 폭 규칙) */
export function AuditionDetailMediaSection({ galleryUrls }: AuditionDetailMediaProps) {
  if (galleryUrls.length === 0) {
    return null
  }

  return (
    <section className="mt-4 w-full">
      <h2
        className="mb-2 w-full text-lg font-semibold"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        이미지
      </h2>
      <AuditionGallery images={galleryUrls} />
    </section>
  )
}
