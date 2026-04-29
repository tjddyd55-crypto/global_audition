'use client'

import Image from 'next/image'

type ApplicantDetailVideoSectionProps = {
  videoUrl?: string | null
  embedUrl: string
  thumbnailUrl?: string | null
}

export default function ApplicantDetailVideoSection({
  videoUrl,
  embedUrl,
  thumbnailUrl,
}: ApplicantDetailVideoSectionProps) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">지원 영상</h3>
      <div className="overflow-hidden rounded-xl bg-black">
        {embedUrl ? (
          <div className="relative aspect-video w-full">
            <iframe
              title="application-video"
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : thumbnailUrl && videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="relative block aspect-video w-full"
          >
            <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-4xl text-white">
              ▶
            </span>
          </a>
        ) : (
          <div className="py-12 text-center">
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-violet-200 underline"
              >
                새 창에서 영상 열기
              </a>
            ) : (
              <span className="text-sm font-medium text-violet-200">영상 링크가 없습니다.</span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
