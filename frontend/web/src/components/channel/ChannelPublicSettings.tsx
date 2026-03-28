'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { channelApi } from '@/lib/api/channel'
import { invalidateAfterChannelVideoMutation } from '@/lib/query/channelVideoQuery'
import { CARD_BASE, TEXT_SUB } from '@/lib/ui/specClasses'

const SWITCH_TRACK = 'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  'aria-label'?: string
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
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function ChannelPublicSettings() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me-channel-meta'],
    queryFn: () => channelApi.getMine(),
  })

  const patchMutation = useMutation({
    mutationFn: (isPublic: boolean) => channelApi.patchMine({ isChannelPublic: isPublic }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me-channel-meta'] })
      await invalidateAfterChannelVideoMutation(queryClient)
      router.refresh()
    },
  })

  if (isLoading || !data) {
    return (
      <div className={CARD_BASE}>
        <p className={TEXT_SUB}>채널 설정을 불러오는 중…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={CARD_BASE}>
        <p className="text-sm text-red-600">채널 설정을 불러오지 못했습니다.</p>
      </div>
    )
  }

  const isPublic = Boolean(data.channelPublic)
  const busy = patchMutation.isPending

  return (
    <div className={`${CARD_BASE} flex flex-col gap-3`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">채널 공개</h3>
          <p className={`${TEXT_SUB} mt-1 text-sm`}>
            켜면 프로필 링크로 내 채널과 <strong className="text-emerald-700">공개로 표시한 영상</strong>만 다른 사용자에게
            보입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isPublic ? 'text-emerald-700' : 'text-neutral-500'}`}>
            {isPublic ? '공개' : '비공개'}
          </span>
          <ToggleSwitch
            aria-label="채널 공개 여부"
            checked={isPublic}
            disabled={busy}
            onChange={(next) => patchMutation.mutate(next)}
          />
        </div>
      </div>
      {isPublic ? (
        <p className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          채널이 공개 상태입니다. 영상별로도「공개」로 설정된 항목만 외부 채널 페이지에 노출됩니다.
        </p>
      ) : null}
      {patchMutation.isError ? (
        <p className="text-sm text-red-600">저장에 실패했습니다. 다시 시도해 주세요.</p>
      ) : null}
    </div>
  )
}
