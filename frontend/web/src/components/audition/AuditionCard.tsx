'use client'

import Link from 'next/link'
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

export default function AuditionCard({ audition }: AuditionCardProps) {
  return (
    <Link
      href={`/auditions/${audition.id}`}
      className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{audition.title}</h3>
        {audition.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{audition.description}</p>
        )}
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
          {statusLabels[audition.status] ?? audition.status}
        </span>
        <p className="text-xs text-gray-500 mt-2">
          {format(new Date(audition.createdAt), 'yyyy.MM.dd', { locale: ko })}
        </p>
      </div>
    </Link>
  )
}
