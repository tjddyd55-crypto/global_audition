'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { channelApi } from '@/shared/api/channel'
import { invalidateAfterChannelVideoMutation } from '@/shared/query/channelVideoQuery'

const SECTION = 'w-full border-b border-neutral-200 py-4'
const BTN_SAVE =
  'w-full rounded-md bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50'
const SWITCH =
  'relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function PublicToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
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

/** 채널 공개 스위치만 저장한다. 소개와 SNS는 프로필 원본이다. */
export function ChannelSettingsPanel() {
  const t = useTranslations('channel')
  const tStudio = useTranslations('studio')
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me-channel-meta'],
    queryFn: () => channelApi.getMine(),
  })
  const [isPublic, setIsPublic] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!data) return
    setIsPublic(Boolean(data.channelPublic ?? data.isPublic))
    setDirty(false)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (next: boolean) => channelApi.patchMine({ isChannelPublic: next }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      await invalidateAfterChannelVideoMutation(queryClient)
      setDirty(false)
    },
  })

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
        <p className="mt-1 text-sm text-neutral-500">
          <Link href="/my/studio/profile" className="underline">
            {tStudio('profileHint')}
          </Link>
        </p>
      </header>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">{t('public')}</p>
          <p className="mt-1 text-sm text-neutral-600">{t('publicHint')}</p>
        </div>
        <PublicToggle
          checked={isPublic}
          disabled={saveMutation.isPending}
          label={t('public')}
          onChange={(next) => {
            setIsPublic(next)
            setDirty(true)
          }}
        />
      </div>
      <button
        type="button"
        className={BTN_SAVE}
        disabled={saveMutation.isPending || !dirty}
        onClick={() => saveMutation.mutate(isPublic)}
      >
        {saveMutation.isPending ? t('saving') : t('save')}
      </button>
      {saveMutation.isError ? <p className="text-sm text-red-600">{t('saveFailed')}</p> : null}
    </section>
  )
}
