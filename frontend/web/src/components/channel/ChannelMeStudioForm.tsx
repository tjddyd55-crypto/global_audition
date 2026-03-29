'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meProfileApi } from '@/lib/api/meProfile'
import { videoApi, type VideoContent } from '@/lib/api/videos'
import { INPUT_BASE } from '@/lib/ui/specClasses'
import { uploadAuditionImage } from '@/lib/api/uploads'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'
import {
  mapChannelCategoriesForApi,
  resolveFeaturedVideoIdForMePatch,
} from '@/lib/channel/channelProfilePatch'

const NATIONALITIES = [
  { value: '', label: '선택 안 함' },
  { value: 'KR', label: '대한민국' },
  { value: 'MN', label: '몽골' },
  { value: 'JP', label: '일본' },
  { value: 'OTHER', label: '기타' },
] as const

const BTN_PRIMARY = 'rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50'
const BTN_GHOST = 'rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50'

const LONG_BIO_MAX = 8000

function normalizeNationality(raw: string | null | undefined): string {
  const n = (raw ?? '').trim().toUpperCase()
  if (n === 'KR' || n === 'MN' || n === 'JP' || n === 'OTHER') return n
  return ''
}

function oneLine30(raw: string): string {
  return raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30)
}

/**
 * PATCH /api/me — 닉네임·프로필 이미지·국적·shortBio·bio·분야·대표 영상
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

  const [nickname, setNickname] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [country, setCountry] = useState('')
  const [shortBio, setShortBio] = useState('')
  const [longBio, setLongBio] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [featuredVideoIdManual, setFeaturedVideoIdManual] = useState('')

  useEffect(() => {
    if (!me) return
    setNickname((me.nickname ?? '').trim())
    setProfileImageUrl((me as { profileImageUrl?: string }).profileImageUrl?.trim() ?? '')
    setCountry(normalizeNationality(me.nationality ?? me.country))
    setShortBio(oneLine30(me.shortBio ?? ''))
    setLongBio((me.bio ?? '').slice(0, LONG_BIO_MAX))
    setCategories((me.categories ?? []).slice(0, 3))
    const fid = me.featuredVideoId?.trim() ?? ''
    setFeaturedVideoIdManual(fid)
  }, [me])

  const saveMutation = useMutation({
    mutationFn: () => {
      const nick = nickname.trim()
      if (!nick) {
        return Promise.reject(new Error('닉네임이 필요합니다.'))
      }
      return meProfileApi.patch({
        nickname: nick,
        profileImageUrl: profileImageUrl.trim() === '' ? null : profileImageUrl.trim(),
        country: country || '',
        shortBio: shortBio.trim() === '' ? null : oneLine30(shortBio),
        bio: longBio.trim() === '' ? null : longBio.trim().slice(0, LONG_BIO_MAX),
        categories,
        featuredVideoId: featuredVideoIdManual.trim(),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me-profile-channel-studio'] })
      await queryClient.invalidateQueries({ queryKey: ['me-profile-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['public-channel'] })
      await queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      await queryClient.invalidateQueries({ queryKey: ['channelVideos'] })
    },
  })

  const onPickProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadBusy(true)
    try {
      const url = await uploadAuditionImage(file, 'profile')
      setProfileImageUrl(url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploadBusy(false)
    }
  }

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

  const previewSrc = profileImageUrl?.trim() || DEFAULT_IMAGES.avatar

  if (isLoading || !me) {
    return <p className="px-3 py-2 text-sm text-neutral-600">프로필을 불러오는 중…</p>
  }

  return (
    <section className="w-full border-b border-neutral-200 py-4">
      <h2 className="px-3 text-lg font-semibold text-neutral-900">채널 프로필</h2>
      <p className="mt-1 px-3 text-sm text-neutral-500">공개 채널에 반영됩니다. (저장: PATCH /api/me)</p>

      <div className="mt-4 space-y-4 px-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col gap-2">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
              <Image src={previewSrc} alt="" fill className="object-cover" unoptimized sizes="96px" />
            </div>
            <label className="cursor-pointer">
              <span className={`inline-flex ${BTN_GHOST} justify-center`}>
                {uploadBusy ? '업로드 중…' : '프로필 이미지'}
              </span>
              <input type="file" accept="image/*" className="hidden" disabled={uploadBusy} onChange={(e) => void onPickProfileImage(e)} />
            </label>
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">닉네임</label>
              <input
                type="text"
                value={nickname}
                maxLength={50}
                onChange={(e) => setNickname(e.target.value)}
                className={INPUT_BASE}
                autoComplete="nickname"
              />
            </div>
          </div>
        </div>

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
          <label className="mb-1 block text-sm font-medium text-neutral-800">한줄 소개 (최대 30자)</label>
          <input
            type="text"
            value={shortBio}
            maxLength={30}
            onChange={(e) => setShortBio(e.target.value.replace(/\r?\n/g, ' ').slice(0, 30))}
            className={INPUT_BASE}
            placeholder="채널을 한 줄로 소개해 주세요"
          />
          <p className="mt-0.5 text-xs text-neutral-500">{shortBio.length} / 30</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">채널 소개 (정보 탭)</label>
          <textarea
            value={longBio}
            maxLength={LONG_BIO_MAX}
            onChange={(e) => setLongBio(e.target.value.slice(0, LONG_BIO_MAX))}
            rows={5}
            className={INPUT_BASE}
            placeholder="상세 소개를 입력해 주세요"
          />
          <p className="mt-0.5 text-xs text-neutral-500">{longBio.length} / {LONG_BIO_MAX}</p>
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
          <p className="mb-2 text-xs text-neutral-500">
            목록에서 선택하거나, 내 채널에 등록한 YouTube URL·영상 ID·채널 영상 UUID를 입력하세요. 비우면 저장 시 해제됩니다.
          </p>
          <input
            type="text"
            value={featuredVideoIdManual}
            onChange={(e) => setFeaturedVideoIdManual(e.target.value)}
            className={`${INPUT_BASE} mb-3 font-mono text-sm`}
            placeholder="UUID 또는 YouTube URL"
          />

          {videosLoading ? (
            <p className="text-sm text-neutral-500">영상 목록을 불러오는 중…</p>
          ) : (
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {videos.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">{v.title}</span>
                  <button type="button" className={BTN_GHOST} onClick={() => setFeaturedFromRow(v)}>
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
