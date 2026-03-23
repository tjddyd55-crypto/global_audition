'use client'

import { useState } from 'react'
import { AUDITION_DETAIL } from '@/lib/design-tokens'
import AuditionGallery from '@/components/gallery/AuditionGallery'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

/** 히어로 대표 이미지: 세로 포스터 3:4 · cover */
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

/**
 * 상세 본문: 대표·갤러리 통합 슬라이더(16:9 · contain) + 풀스크린 모달
 */
export function AuditionDetailMediaSection({ coverUrl, galleryUrls }: AuditionDetailMediaProps) {
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
          이미지
        </h2>
        <p className="m-0 mb-4 text-sm text-gray-500">
          대표 이미지를 포함해 슬라이드로 볼 수 있습니다. 좌우 버튼·스와이프로 넘길 수 있고, 메인 영역을 누르면 전체 화면으로 확대됩니다.
        </p>
        <AuditionGallery coverImage={coverUrl} images={galleryUrls} />
      </div>
    </div>
  )
}
