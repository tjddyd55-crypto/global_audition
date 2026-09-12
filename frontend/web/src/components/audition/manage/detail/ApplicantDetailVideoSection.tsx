'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

type ApplicantDetailVideoSectionProps = {
  videoUrl?: string | null
  embedUrl?: string | null
  thumbnailUrl?: string | null
}

export default function ApplicantDetailVideoSection({
  videoUrl,
  embedUrl,
  thumbnailUrl,
}: ApplicantDetailVideoSectionProps) {
  const tAgency = useTranslations('agency')
  const tDetail = useTranslations('auditionDetail')

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{tAgency('applyVideo')}</h3>
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
                {tDetail('openVideoNew')}
              </a>
            ) : (
              <span className="text-sm font-medium text-violet-200">{tAgency('noVideoLink')}</span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
