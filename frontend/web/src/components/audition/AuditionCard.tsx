'use client'

import { Link } from '../../i18n.config'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { AuditionResponse } from '../../lib/api/auditions'

interface AuditionCardProps {
  audition: AuditionResponse
}

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  OPEN: '모집중',
  CLOSED: '마감',
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'OPEN'
      ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'CLOSED'
        ? 'bg-gray-100 text-gray-700 border-gray-200'
        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  if (!audition) return null
  const id = audition?.id ?? ''
  const title = audition?.title ?? '제목 없음'
  const status = audition?.status ?? 'DRAFT'
  const category = audition?.category ?? ''
  const description = audition?.description ?? ''
  const createdAt = audition?.createdAt
  const dateStr = createdAt
    ? (() => {
        try {
          return format(new Date(createdAt), 'yyyy-MM-dd', { locale: ko })
        } catch {
          return '-'
        }
      })()
    : '-'

  return (
    <Link href={`/auditions/${id}`}>
      <article className="h-full cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-purple-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">{title}</h3>
          <StatusBadge status={status} />
        </div>
        {category && (
          <span className="mb-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium">
            {category}
          </span>
        )}
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
        )}
        <p className="flex items-center text-xs text-gray-500">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {dateStr}
        </p>
      </article>
    </Link>
  )
}
