'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meProfileApi } from '@/lib/api/meProfile'
import { videoApi, type VideoContent } from '@/lib/api/videos'
import { INPUT_BASE } from '@/lib/ui/specClasses'

const NATIONALITIES = [
  { value: '', label: '선택 안 함' },
  { value: 'KR', label: '대한민국' },
  { value: 'MN', label: '몽골' },
  { value: 'JP', label: '일본' },
  { value: 'OTHER', label: '기타' },
] as const

const BTN_PRIMARY = 'rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50'
const BTN_GHOST = 'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50'

function normalizeNationality(raw: string | null | undefined): string {
  const n = (raw ?? '').trim().toUpperCase()
  if (n === 'KR' || n === 'MN' || n === 'JP' || n === 'OTHER') return n
  return ''
}

/**
 * PATCH /api/me — 국적·한줄 소개(100)·분야(3)·대표 영상
 */
export function ChannelMeStudioForm() {
  const queryClient = useQueryClient()
  const { data: me, isLoading } = useQuery({
    queryKey: ['me-profile-channel-studio'],
    queryFn: () => meProfileApi.get(),
    retry: false,
  })

  const { data: videosPayload, isLoading: videosLoading } = useQuery({
    queryKey: ['me-channel-videos-studio'],
    queryFn: () => videoApi.getMyChannelVideos(),
    retry: false,
  })

  const videos = useMemo(() => videosPayload?.content ?? [], [videosPayload?.content])

  const [country, setCountry] = useState('')
  const [bio, setBio] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [featuredVideoIdManual, setFeaturedVideoIdManual] = useState('')

  useEffect(() => {
    if (!me) return
    setCountry(normalizeNationality(me.nationality ?? me.country))
    setBio((me.bio ?? '').slice(0, 100))
    setCategories((me.categories ?? []).slice(0, 3))
    const fid = me.featuredVideoId?.trim() ?? ''
    setFeaturedVideoIdManual(fid)
  }, [me])

  const saveMutation = useMutation({
    mutationFn: () =>
      meProfileApi.patch({
        country: country || '',
        bio: bio.trim() === '' ? null : bio.trim().slice(0, 100),
        categories,
        featuredVideoId: featuredVideoIdManual.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me-profile-channel-studio'] })
      await queryClient.invalidateQueries({ queryKey: ['me-profile-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['public-channel'] })
      await queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      await queryClient.invalidateQueries({ queryKey: ['channelVideos'] })
    },
  })

  const addCategory = useCallback(() => {
    const t = categoryInput.trim()
    if (!t || categories.length >= 3) return
    if (categories.includes(t)) return
    setCategories((c) => [...c, t].slice(0, 3))
    setCategoryInput('')
  }, [categoryInput, categories])

  const removeCategory = useCallback((x: string) => {
    setCategories((c) => c.filter((y) => y !== x))
  }, [])

  const setFeaturedFromRow = useCallback((v: VideoContent) => {
    setFeaturedVideoIdManual(v.id)
  }, [])

  if (isLoading || !me) {
    return <p className="px-3 py-2 text-sm text-neutral-600">프로필을 불러오는 중…</p>
  }

  return (
    <section className="w-full border-b border-neutral-200 py-4">
      <h2 className="px-3 text-lg font-semibold text-neutral-900">채널 프로필</h2>
      <p className="mt-1 px-3 text-sm text-neutral-500">공개 채널 상단에 노출됩니다. (저장: PATCH /api/me)</p>

      <div className="mt-4 space-y-4 px-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">국적</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={INPUT_BASE}>
            {NATIONALITIES.map((o) => (
              <option key={o.value || 'none'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">한줄 소개 (최대 100자)</label>
          <input
            type="text"
            value={bio}
            maxLength={100}
            onChange={(e) => setBio(e.target.value.slice(0, 100))}
            className={INPUT_BASE}
            placeholder="채널을 한 줄로 소개해 주세요"
          />
          <p className="mt-0.5 text-xs text-neutral-500">{bio.length} / 100</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">분야 (최대 3개)</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => removeCategory(c)}
                className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm text-neutral-800"
              >
                {c} ✕
              </button>
            ))}
          </div>
          {categories.length < 3 ? (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className={`${INPUT_BASE} flex-1`}
                placeholder="예: 보컬"
              />
              <button type="button" className={BTN_GHOST} onClick={addCategory}>
                추가
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">대표 영상</label>
          <p className="mb-2 text-xs text-neutral-500">목록에서 선택하거나 영상 ID를 직접 입력하세요. 비우면 저장 시 해제됩니다.</p>
          <input
            type="text"
            value={featuredVideoIdManual}
            onChange={(e) => setFeaturedVideoIdManual(e.target.value)}
            className={`${INPUT_BASE} mb-3 font-mono text-sm`}
            placeholder="video UUID (선택)"
          />

          {videosLoading ? (
            <p className="text-sm text-neutral-500">영상 목록을 불러오는 중…</p>
          ) : (
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {videos.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">{v.title}</span>
                  <button
                    type="button"
                    className={BTN_GHOST}
                    onClick={() => setFeaturedFromRow(v)}
                  >
                    대표로 설정
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          disabled={saveMutation.isPending}
          className={`${BTN_PRIMARY} w-full`}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? '저장 중…' : '채널 프로필 저장'}
        </button>
        {saveMutation.isError ? (
          <p className="text-sm text-red-600">저장에 실패했습니다. 입력 값을 확인해 주세요.</p>
        ) : null}
        {saveMutation.isSuccess ? <p className="text-sm text-neutral-600">저장되었습니다.</p> : null}
      </div>
    </section>
  )
}
