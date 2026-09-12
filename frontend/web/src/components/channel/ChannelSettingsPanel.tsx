'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  channelApi,
  type MyChannelSummary,
  type PatchMyChannelBody,
  type SnsLinkRow,
  type SnsPlatformCode,
} from '@/shared/api/channel'
import { useRouter } from 'next/navigation'
import { invalidateAfterChannelVideoMutation } from '@/shared/query/channelVideoQuery'
import { useTranslations } from 'next-intl'

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
  { value: 'OTHER', label: 'OTHER' },
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
      aria-label={useTranslations('channel')('public')}
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
    introText: data.introText ?? '',
    isPublic: Boolean(data.channelPublic ?? data.isPublic),
    snsLinks: links.length > 0 ? links : [{ platform: 'YOUTUBE', url: '' }],
  }
}

export function ChannelSettingsPanel() {
  const t = useTranslations('channel')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me-channel-meta'],
    queryFn: () => channelApi.getMine(),
  })

  const [introText, setIntroText] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [snsLinks, setSnsLinks] = useState<SnsLinkRow[]>([{ platform: 'YOUTUBE', url: '' }])
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
    setIntroText(s.introText)
    setIsPublic(s.isPublic)
    setSnsLinks(s.snsLinks)
    setDirty(false)
    saveMutation.reset()
  }, [data])

  const markDirty = useCallback(() => {
    setDirty(true)
    saveMutation.reset()
  }, [saveMutation])

  const onSave = () => {
    const payloadSns = snsLinks
      .map((r) => ({ platform: r.platform.trim().toUpperCase(), url: r.url.trim() }))
      .filter((r) => r.platform.length > 0 && r.url.length > 0)

    const body: PatchMyChannelBody = {
      introText: introText.trim() === '' ? null : introText.trim(),
      isChannelPublic: isPublic,
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
    if (saveMutation.isError) return { tone: 'text-red-600' as const, text: t('saveFailed') }
    if (saveMutation.isSuccess && !saveMutation.isPending) return { tone: 'text-neutral-700' as const, text: t('saved') }
    if (!dirty) return { tone: 'text-neutral-500' as const, text: t('noChanges') }
    return null
  }, [dirty, saveMutation.isError, saveMutation.isPending, saveMutation.isSuccess, t])

  if (isLoading || !data) {
    return (
      <section className={SECTION}>
        <p className="text-sm text-neutral-500">{t('loadingSettings')}</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className={SECTION}>
        <p className="text-sm text-red-600">{t('loadFailed')}</p>
      </section>
    )
  }

  return (
    <section className={`${SECTION} flex flex-col gap-4`}>
      <header>
        <h2 className="text-lg font-semibold text-neutral-900">{t('settingsTitle')}</h2>
        <p className="mt-1 whitespace-normal break-words text-sm text-neutral-500">
          {t('settingsHint')}
        </p>
      </header>

      <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label className="mb-1.5 block whitespace-normal break-words text-sm font-medium text-neutral-800">{t('extraIntro')}</label>
            <p className="mb-1.5 whitespace-normal break-words text-xs text-neutral-500">{t('extraIntroHint')}</p>
            <textarea
              value={introText}
              onChange={(e) => {
                setIntroText(e.target.value)
                markDirty()
              }}
              rows={4}
              className={INPUT_STYLE}
              placeholder={t('extraIntroPlaceholder')}
              maxLength={4000}
            />
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">{t('public')}</p>
                <p className="mt-1 whitespace-normal break-words text-xs leading-relaxed text-neutral-600 sm:text-sm">
                  {t('publicHint')}
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

      <div className="border-t border-neutral-100 pt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-neutral-800">{t('snsLinks')}</span>
          <button
            type="button"
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 sm:text-sm"
            onClick={addSnsRow}
          >
            {t('addSns')}
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
                    {p.value === 'OTHER' ? t('snsOther') : p.label}
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
                {tCommon('delete')}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 whitespace-normal break-words text-xs text-neutral-500">{t('snsUrlHint')}</p>
      </div>

      <div className="space-y-2 border-t border-neutral-100 pt-4">
        <button type="button" className={BTN_SAVE} disabled={saveMutation.isPending || !dirty} onClick={() => void onSave()}>
          {saveMutation.isPending ? t('saving') : t('save')}
        </button>
        {statusHint ? <p className={`text-left text-xs sm:text-sm ${statusHint.tone}`}>{statusHint.text}</p> : null}
      </div>
    </section>
  )
}
