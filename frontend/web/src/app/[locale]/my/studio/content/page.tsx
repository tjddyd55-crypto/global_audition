'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { channelApi } from '@/shared/api/channel'
import { videoApi, type VideoContent } from '@/shared/api/videos'
import { extractYoutubeVideoId, getYoutubeId } from '@/shared/audition/youtubeEmbed'
import { RECRUIT_FIELD_CODES } from '@/shared/audition/recruitFields'
import { apiErrorCode } from '@/shared/channel/apiErrorCode'
import { formatCount } from '@/shared/money/currency'
import { INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const ERROR_KEY: Record<string, string> = {
  YOUTUBE_URL_REQUIRED: 'errYoutube',
  CHANNEL_VIDEO_DUPLICATE: 'errDuplicate',
  CHANNEL_VIDEO_LIMIT: 'errLimit',
}

function youtubeIdOf(url: string): string | null {
  const u = url.trim()
  if (!u) return null
  const id = getYoutubeId(u) ?? extractYoutubeVideoId(u)
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

type Draft = { title: string; videoUrl: string; description: string; category: string; status: string }
const EMPTY: Draft = { title: '', videoUrl: '', description: '', category: '', status: 'PRIVATE' }

/** 내 채널 영상: YouTube 링크 등록만 지원(파일 업로드·자체 저장 없음). */
export default function StudioContentPage() {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const tField = useTranslations('recruitField')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const videos = useQuery({ queryKey: ['studio', 'videos'], queryFn: videoApi.getMyChannelVideos })
  const channel = useQuery({ queryKey: ['studio', 'channel'], queryFn: channelApi.getMine })
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Draft>(EMPTY)

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['studio', 'videos'] })
    await queryClient.invalidateQueries({ queryKey: ['studio', 'channel'] })
  }
  const fail = (e: unknown) => {
    const key = ERROR_KEY[apiErrorCode(e)]
    setMessage(key ? t(key) : t('saveFailed'))
  }

  const create = useMutation({
    mutationFn: () =>
      videoApi.createVideo({
        title: draft.title.trim(),
        videoUrl: draft.videoUrl.trim(),
        description: draft.description.trim() || undefined,
        category: draft.category || undefined,
        status: draft.status,
      }),
    onSuccess: async () => {
      setDraft(EMPTY)
      setMessage(t('saved'))
      await refresh()
    },
    onError: fail,
  })
  const update = useMutation({
    mutationFn: () =>
      videoApi.updateVideo(editingId ?? '', {
        title: edit.title.trim(),
        videoUrl: edit.videoUrl.trim(),
        description: edit.description,
        category: edit.category,
      }),
    onSuccess: async () => {
      setEditingId(null)
      setMessage(t('saved'))
      await refresh()
    },
    onError: fail,
  })
  const setVisibility = useMutation({
    mutationFn: (v: VideoContent) => videoApi.updateVideo(v.id, { status: v.status === 'PUBLISHED' ? 'PRIVATE' : 'PUBLISHED' }),
    onSuccess: refresh,
    onError: fail,
  })
  const recheck = useMutation({ mutationFn: (id: string) => videoApi.recheckVideo(id), onSuccess: refresh, onError: fail })
  const feature = useMutation({
    mutationFn: (id: string) => channelApi.patchMine({ featuredVideoId: id }),
    onSuccess: refresh,
    onError: fail,
  })
  const remove = useMutation({
    mutationFn: (id: string) => videoApi.deleteVideo(id),
    onSuccess: async () => {
      setMessage(t('saved'))
      await refresh()
    },
    onError: fail,
  })

  const rows = videos.data?.content ?? []
  const max = channel.data?.maxVideos ?? 50
  const previewId = youtubeIdOf(draft.videoUrl)
  const featuredId = channel.data?.featuredVideoId ?? null

  const embedBadge = (v: VideoContent) => {
    const s = v.embedStatus
    const [key, cls] =
      s === 'OK'
        ? ['embedOk', 'bg-emerald-50 text-emerald-700']
        : s === 'NOT_FOUND'
          ? ['embedNotFound', 'bg-red-50 text-red-700']
          : s === 'RESTRICTED'
            ? ['embedRestricted', 'bg-amber-50 text-amber-800']
            : ['embedUnknown', 'bg-neutral-100 text-neutral-600']
    return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{t(key)}</span>
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('content')}</h2>
      <p className={TEXT_SUB}>{t('youtubeHint')}</p>
      <p className={TEXT_SUB}>{t('unlistedNote')}</p>
      <form
        className="flex max-w-2xl flex-col gap-3"
        data-testid="studio-video-form"
        onSubmit={(event) => {
          event.preventDefault()
          setMessage(null)
          if (!previewId) {
            setMessage(t('errYoutube'))
            return
          }
          create.mutate()
        }}
      >
        <label className="text-sm font-medium">
          {t('youtubeUrl')}
          <input
            className={INPUT_BASE}
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={draft.videoUrl}
            onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
            required
            data-testid="video-url"
          />
        </label>
        {draft.videoUrl.trim() ? (
          previewId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`} alt="" className="aspect-video w-full max-w-xs rounded-lg object-cover" />
          ) : (
            <p className="text-sm text-red-600">{t('errYoutube')}</p>
          )
        ) : null}
        <label className="text-sm font-medium">
          {t('title')}
          <input className={INPUT_BASE} maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required data-testid="video-title" />
        </label>
        <label className="text-sm font-medium">
          {t('videoDescription')}
          <textarea className={INPUT_BASE} rows={3} maxLength={2000} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            {t('videoCategory')}
            <select className={INPUT_BASE} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="">—</option>
              {RECRUIT_FIELD_CODES.map((c) => (
                <option key={c} value={c}>
                  {tField(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t('visibility')}
            <select className={INPUT_BASE} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              <option value="PRIVATE">{t('visibilityPrivate')}</option>
              <option value="PUBLISHED">{t('visibilityPublic')}</option>
            </select>
          </label>
        </div>
        <p className={TEXT_SUB}>
          {t('videoLimit', { max })} ({rows.length}/{max})
        </p>
        <button
          type="submit"
          disabled={create.isPending || rows.length >= max}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          data-testid="video-add"
        >
          {t('addVideo')}
        </button>
      </form>
      {message ? (
        <p className={TEXT_SUB} role="status">
          {message}
        </p>
      ) : null}
      {videos.isLoading ? <p className={TEXT_SUB}>{tCommon('loading')}</p> : null}
      {videos.isError ? <p className="text-sm text-red-600">{t('saveFailed')}</p> : null}
      {rows.length === 0 && !videos.isLoading ? <p className={TEXT_SUB}>{t('noVideos')}</p> : null}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="studio-video-list">
        {rows.map((video) => (
          <li key={video.id} className="flex min-w-0 flex-col gap-2 rounded-xl border border-neutral-200 p-3">
            <div className="flex min-w-0 gap-3">
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="" className="aspect-video w-32 shrink-0 rounded-md object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="break-words font-medium text-gray-900">{video.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold">
                    {video.status === 'PUBLISHED' ? t('visibilityPublic') : t('visibilityPrivate')}
                  </span>
                  {embedBadge(video)}
                  {video.id === featuredId ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">{t('featuredBadge')}</span>
                  ) : null}
                  {video.shorts ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Shorts</span> : null}
                </div>
                <div className={`mt-1 ${TEXT_SUB}`}>
                  {t('views')} {formatCount(video.viewCount, locale)}
                </div>
              </div>
            </div>
            {editingId === video.id ? (
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!youtubeIdOf(edit.videoUrl)) {
                    setMessage(t('errYoutube'))
                    return
                  }
                  update.mutate()
                }}
              >
                <input className={INPUT_BASE} value={edit.videoUrl} onChange={(e) => setEdit({ ...edit, videoUrl: e.target.value })} required aria-label={t('youtubeUrl')} />
                <input className={INPUT_BASE} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required aria-label={t('title')} />
                <textarea className={INPUT_BASE} rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} aria-label={t('videoDescription')} />
                <select className={INPUT_BASE} value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} aria-label={t('videoCategory')}>
                  <option value="">—</option>
                  {RECRUIT_FIELD_CODES.map((c) => (
                    <option key={c} value={c}>
                      {tField(c)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="submit" disabled={update.isPending} className="h-9 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white">
                    {tCommon('save')}
                  </button>
                  <button type="button" className="h-9 rounded-full border px-4 text-sm" onClick={() => setEditingId(null)}>
                    {t('careerCancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {video.status === 'PUBLISHED' ? (
                  <Link href={`/videos/${video.id}`} className="inline-flex h-8 items-center rounded-full border px-3">
                    {t('play')}
                  </Link>
                ) : null}
                <button type="button" className="h-8 rounded-full border px-3" onClick={() => setVisibility.mutate(video)}>
                  {video.status === 'PUBLISHED' ? t('makePrivate') : t('makePublic')}
                </button>
                {video.id !== featuredId ? (
                  <button type="button" className="h-8 rounded-full border px-3" onClick={() => feature.mutate(video.id)}>
                    {t('setFeatured')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="h-8 rounded-full border px-3"
                  onClick={() => {
                    setEditingId(video.id)
                    setEdit({
                      title: video.title,
                      videoUrl: video.videoUrl,
                      description: video.description ?? '',
                      category: video.category ?? '',
                      status: video.status,
                    })
                  }}
                >
                  {t('editVideo')}
                </button>
                {video.embedStatus !== 'OK' ? (
                  <button type="button" className="h-8 rounded-full border px-3" disabled={recheck.isPending} onClick={() => recheck.mutate(video.id)}>
                    {t('recheck')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="h-8 rounded-full border border-red-200 px-3 text-red-700"
                  onClick={() => {
                    if (typeof window === 'undefined' || window.confirm(t('deleteVideo') + '?')) remove.mutate(video.id)
                  }}
                >
                  {t('deleteVideo')}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
