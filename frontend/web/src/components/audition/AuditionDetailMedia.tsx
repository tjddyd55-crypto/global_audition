'use client'

import { useState } from 'react'
import { AUDITION_DETAIL } from '@/lib/design-tokens'
import AuditionGallery from '@/components/gallery/AuditionGallery'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/** 히어로 대표 이미지: 3:4 박스 안 cover — 상단(얼굴·타이틀) 우선, md+는 중앙 */
export function AuditionDetailHeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const trimmed = src.trim()
  const url = !trimmed || failed ? AUDITION_COVER_PLACEHOLDER_SRC : trimmed

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="absolute inset-0 h-full w-full object-cover object-top md:object-center"
      onError={() => setFailed(true)}
    />
  )
}

type AuditionDetailMediaProps = {
  /** 대표 URL 제외·중복 제거된 갤러리만 */
  galleryUrls: string[]
}

/**
 * 상세 본문: 갤러리 전용 슬라이더(16:9 · contain) + 풀스크린 모달.
 * 대표 이미지는 히어로에서만 노출한다.
 */
export function AuditionDetailMediaSection({ galleryUrls }: AuditionDetailMediaProps) {
  if (galleryUrls.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div>
        <h2
          className="m-0 mb-3"
          style={{
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          추가 이미지
        </h2>
        <AuditionGallery images={galleryUrls} />
      </div>
    </div>
  )
}
