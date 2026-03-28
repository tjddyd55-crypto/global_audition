'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { videoApi, type VideoContent } from '@/lib/api/videos'

const SWITCH_TRACK =
  'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50'

function MiniToggle({
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
      aria-label={checked ? '영상 공개' : '영상 비공개'}
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

type QueryPrefix = readonly unknown[]

export function VideoVisibilitySwitch({ video }: { video: VideoContent }) {
  const queryClient = useQueryClient()
  const vis = video.visibility ?? (video.status === 'PUBLISHED' ? 'PUBLIC' : 'PRIVATE')
  const isPublic = vis === 'PUBLIC'

  const mut = useMutation({
    mutationFn: (next: 'PUBLIC' | 'PRIVATE') => videoApi.patchVideoVisibility(video.id, next),
    onSuccess: async () => {
      const keys: QueryPrefix[] = [
        ['my-channel-videos'],
        ['my-channel-videos-profile'],
        ['my-channel-videos-mobile-profile'],
      ]
      for (const k of keys) {
        await queryClient.invalidateQueries({ queryKey: k })
      }
    },
  })

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
      <span className={`text-xs font-medium ${isPublic ? 'text-emerald-700' : 'text-neutral-500'}`}>
        영상 {isPublic ? '공개' : '비공개'}
      </span>
      <MiniToggle
        checked={isPublic}
        disabled={mut.isPending}
        onChange={(on) => mut.mutate(on ? 'PUBLIC' : 'PRIVATE')}
      />
    </div>
  )
}
