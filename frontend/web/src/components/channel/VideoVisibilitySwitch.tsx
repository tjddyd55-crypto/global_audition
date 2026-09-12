'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { videoApi, type VideoContent } from '@/shared/api/videos'
import { invalidateAfterChannelVideoMutation } from '@/shared/query/channelVideoQuery'

const SWITCH_TRACK =
  'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50'

function MiniToggle({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${SWITCH_TRACK} ${checked ? 'bg-emerald-500' : 'bg-neutral-300'}`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function VideoVisibilitySwitch({ video }: { video: VideoContent }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const t = useTranslations('channel')
  const vis = video.visibility ?? (video.status === 'PUBLISHED' ? 'PUBLIC' : 'PRIVATE')
  const isPublic = vis === 'PUBLIC'

  const mut = useMutation({
    mutationFn: (next: 'PUBLIC' | 'PRIVATE') => videoApi.patchVideoVisibility(video.id, next),
    onSuccess: async () => {
      await invalidateAfterChannelVideoMutation(queryClient)
      router.refresh()
    },
  })

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
      <span className={`text-xs font-medium ${isPublic ? 'text-emerald-700' : 'text-neutral-500'}`}>
        {isPublic ? t('videoPublicState') : t('videoPrivateState')}
      </span>
      <MiniToggle
        checked={isPublic}
        disabled={mut.isPending}
        ariaLabel={isPublic ? t('videoPublicAria') : t('videoPrivateAria')}
        onChange={(on) => mut.mutate(on ? 'PUBLIC' : 'PRIVATE')}
      />
    </div>
  )
}
