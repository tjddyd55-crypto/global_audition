'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { videoApi } from '@/shared/api/videos'
import { formatCount } from '@/shared/money/currency'
import { INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioContentPage() {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const videos = useQuery({ queryKey: ['studio', 'videos'], queryFn: videoApi.getMyChannelVideos })
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [message, setMessage] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => videoApi.createVideo({ title: title.trim(), videoUrl: videoUrl.trim(), status: visibility }),
    onSuccess: async () => {
      setTitle('')
      setVideoUrl('')
      setMessage(t('saved'))
      await queryClient.invalidateQueries({ queryKey: ['studio', 'videos'] })
    },
    onError: () => setMessage(t('saveFailed')),
  })

  return (
    <div className="flex flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('content')}</h2>
      <p className={TEXT_SUB}>{t('contentHint')}</p>
      <form
        className="flex max-w-2xl flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          setMessage(null)
          create.mutate()
        }}
      >
        <label className="text-sm font-medium">
          {t('title')}
          <input className={INPUT_BASE} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="text-sm font-medium">
          {t('videoUrl')}
          <input className={INPUT_BASE} type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required />
        </label>
        <label className="text-sm font-medium">
          {t('visibility')}
          <select className={INPUT_BASE} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="PRIVATE">PRIVATE</option>
            <option value="PUBLISHED">PUBLIC</option>
          </select>
        </label>
        <button type="submit" disabled={create.isPending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {t('addVideo')}
        </button>
      </form>
      {message ? <p className={TEXT_SUB}>{message}</p> : null}
      {videos.isLoading ? <p className={TEXT_SUB}>{tCommon('loading')}</p> : null}
      {videos.isError ? <p className="text-sm text-red-600">{t('saveFailed')}</p> : null}
      {(videos.data?.content ?? []).length === 0 && !videos.isLoading ? <p className={TEXT_SUB}>{t('noVideos')}</p> : null}
      <ul className="flex flex-col gap-2">
        {(videos.data?.content ?? []).map((video) => (
          <li key={video.id} className="rounded-lg border border-neutral-200 p-3">
            <div className="font-medium text-gray-900">{video.title}</div>
            <div className={TEXT_SUB}>
              {video.status} · {t('views')} {formatCount(video.viewCount, locale)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
