'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  channelApi,
  type MyChannelSummary,
  type PatchMyChannelBody,
  type SnsLinkRow,
  type SnsPlatformCode,
} from '@/lib/api/channel'
import { useRouter } from 'next/navigation'
import { invalidateAfterChannelVideoMutation } from '@/lib/query/channelVideoQuery'
import { uploadAuditionImage } from '@/lib/api/uploads'
import { DEFAULT_IMAGES } from '@/lib/constants/fallbacks'

/** 풀 가로·유튜브형 채널 UI와 통일: 카드/그림자 없음 */
const SECTION =
  'w-full border-b border-neutral-200 py-4'
const INPUT_STYLE =
  'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-900/10'
const BTN_GHOST =
  'rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50'
const BTN_SAVE =
  'w-full rounded-md bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50'

const SNS_BASE: { value: SnsPlatformCode; label: string }[] = [
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'X (Twitter)' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'OTHER', label: '기타' },
]

/** GET 응답은 소문자 플랫폼일 수 있음 → 선택 값은 대문자 enum 과 맞춤 */
function normalizePlatformFromApi(platform: string): string {
  const lower = platform.trim().toLowerCase()
  const map: Record<string, SnsPlatformCode> = {
    youtube: 'YOUTUBE',
    instagram: 'INSTAGRAM',
    tiktok: 'TIKTOK',
    twitter: 'TWITTER',
    facebook: 'FACEBOOK',
    other: 'OTHER',
  }
  return map[lower] ?? platform.trim()
}

function selectOptionsForRow(currentPlatform: string): { value: string; label: string }[] {
  const inBase = SNS_BASE.some((p) => p.value === currentPlatform)
  if (inBase) return SNS_BASE
  return [...SNS_BASE, { value: currentPlatform as SnsPlatformCode, label: currentPlatform }]
}

const SWITCH =
  'relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function PublicToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="채널 공개"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${SWITCH} ${checked ? 'bg-neutral-900' : 'bg-neutral-300'}`}
    >
      <span
        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition duration-200 ease-out ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function mapSummaryToState(data: MyChannelSummary) {
  const links = (data.snsLinks ?? []).map((l) => ({
    platform: normalizePlatformFromApi(l.platform),
    url: l.url,
  }))
  return {
    nickname: data.nickname ?? data.channelName ?? '',
    introText: data.introText ?? '',
    profileImageUrl: data.profileImageUrl ?? data.profileImage ?? '',
    isPublic: Boolean(data.channelPublic ?? data.isPublic),
    snsLinks: links.length > 0 ? links : [{ platform: 'YOUTUBE', url: '' }],
  }
}

export function ChannelSettingsPanel() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me-channel-meta'],
    queryFn: () => channelApi.getMine(),
  })

  const [nickname, setNickname] = useState('')
  const [introText, setIntroText] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [snsLinks, setSnsLinks] = useState<SnsLinkRow[]>([{ platform: 'YOUTUBE', url: '' }])
  const [uploadBusy, setUploadBusy] = useState(false)
  const [dirty, setDirty] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (body: PatchMyChannelBody) => channelApi.patchMine(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      await invalidateAfterChannelVideoMutation(queryClient)
      router.refresh()
      setDirty(false)
    },
  })

  useEffect(() => {
    if (!data) return
    const s = mapSummaryToState(data)
    setNickname(s.nickname)
    setIntroText(s.introText)
    setProfileImageUrl(s.profileImageUrl)
    setIsPublic(s.isPublic)
    setSnsLinks(s.snsLinks)
    setDirty(false)
    saveMutation.reset()
  }, [data])

  const markDirty = useCallback(() => {
    setDirty(true)
    saveMutation.reset()
  }, [saveMutation])

  const onPickProfileImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadBusy(true)
    try {
      const url = await uploadAuditionImage(file, 'profile')
      setProfileImageUrl(url)
      markDirty()
    } catch (err) {
      console.error(err)
    } finally {
      setUploadBusy(false)
    }
  }

  const onSave = () => {
    const trimmedNick = nickname.trim()
    if (!trimmedNick) {
      alert('채널 이름(닉네임)을 입력해 주세요.')
      return
    }
    const payloadSns = snsLinks
      .map((r) => ({ platform: r.platform.trim().toUpperCase(), url: r.url.trim() }))
      .filter((r) => r.platform.length > 0 && r.url.length > 0)

    const body: PatchMyChannelBody = {
      nickname: trimmedNick,
      introText: introText.trim() === '' ? null : introText.trim(),
      isChannelPublic: isPublic,
      profileImage: profileImageUrl.trim() === '' ? null : profileImageUrl.trim(),
      snsLinks: payloadSns,
    }
    saveMutation.mutate(body)
  }

  const addSnsRow = () => {
    setSnsLinks((prev) => [...prev, { platform: 'YOUTUBE', url: '' }])
    markDirty()
  }

  const removeSnsRow = (idx: number) => {
    setSnsLinks((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next.length > 0 ? next : [{ platform: 'YOUTUBE', url: '' }]
    })
    markDirty()
  }

  const updateSns = (idx: number, field: 'platform' | 'url', value: string) => {
    setSnsLinks((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)))
    markDirty()
  }

  const statusHint = useMemo(() => {
    if (saveMutation.isError) return { tone: 'text-red-600' as const, text: '저장에 실패했습니다.' }
    if (saveMutation.isSuccess && !saveMutation.isPending) return { tone: 'text-neutral-700' as const, text: '저장되었습니다.' }
    if (!dirty) return { tone: 'text-neutral-500' as const, text: '변경 사항이 없습니다.' }
    return null
  }, [dirty, saveMutation.isError, saveMutation.isPending, saveMutation.isSuccess])

  if (isLoading || !data) {
    return (
      <section className={SECTION}>
        <p className="text-sm text-neutral-500">채널 설정을 불러오는 중…</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className={SECTION}>
        <p className="text-sm text-red-600">채널 설정을 불러오지 못했습니다.</p>
      </section>
    )
  }

  const previewSrc = profileImageUrl?.trim() || DEFAULT_IMAGES.avatar

  return (
    <section className={`${SECTION} flex flex-col gap-4`}>
      <header>
        <h2 className="text-lg font-semibold text-neutral-900">채널 설정</h2>
        <p className="mt-1 text-sm text-neutral-500">프로필과 공개 여부는 저장 즉시 공개 채널 페이지(`/channel/...`)에 반영됩니다.</p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col gap-2 sm:w-36">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
            <Image src={previewSrc} alt="" fill className="object-cover" unoptimized sizes="96px" />
          </div>
          <label className="cursor-pointer">
            <span className={`inline-flex ${BTN_GHOST} w-full justify-center sm:w-auto`}>{uploadBusy ? '업로드 중…' : '이미지 변경'}</span>
            <input type="file" accept="image/*" className="hidden" disabled={uploadBusy} onChange={(e) => void onPickProfileImage(e)} />
          </label>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">채널 이름</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value)
                markDirty()
              }}
              className={INPUT_STYLE}
              maxLength={50}
              placeholder="닉네임"
              autoComplete="nickname"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">채널 소개글</label>
            <textarea
              value={introText}
              onChange={(e) => {
                setIntroText(e.target.value)
                markDirty()
              }}
              rows={4}
              className={INPUT_STYLE}
              placeholder="채널을 소개해 주세요."
              maxLength={4000}
            />
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">채널 공개</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                  공개 시 다른 사용자가 내 채널과 영상을 볼 수 있습니다
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`text-xs font-semibold sm:text-sm ${isPublic ? 'text-neutral-900' : 'text-neutral-500'}`}>
                  {isPublic ? 'ON' : 'OFF'}
                </span>
                <PublicToggle
                  checked={isPublic}
                  disabled={saveMutation.isPending}
                  onChange={(next) => {
                    setIsPublic(next)
                    markDirty()
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-neutral-800">SNS 링크</span>
          <button
            type="button"
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 sm:text-sm"
            onClick={addSnsRow}
          >
            + SNS 추가
          </button>
        </div>
        <div className="flex flex-col divide-y divide-neutral-200">
          {snsLinks.map((row, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-stretch sm:gap-2"
            >
              <select
                value={row.platform}
                onChange={(e) => updateSns(idx, 'platform', e.target.value)}
                className={`${INPUT_STYLE} sm:max-w-[140px] sm:shrink-0`}
              >
                {selectOptionsForRow(row.platform).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={row.url}
                onChange={(e) => updateSns(idx, 'url', e.target.value)}
                className={`${INPUT_STYLE} min-w-0 flex-1`}
                placeholder="https://"
              />
              <button
                type="button"
                className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 sm:w-20 sm:shrink-0"
                onClick={() => removeSnsRow(idx)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-500">https URL만 저장됩니다. 빈 행은 저장 시 제외됩니다.</p>
      </div>

      <div className="space-y-2 border-t border-neutral-100 pt-4">
        <button type="button" className={BTN_SAVE} disabled={saveMutation.isPending || !dirty} onClick={() => void onSave()}>
          {saveMutation.isPending ? '저장 중…' : '저장하기'}
        </button>
        {statusHint ? <p className={`text-left text-xs sm:text-sm ${statusHint.tone}`}>{statusHint.text}</p> : null}
      </div>
    </section>
  )
}
