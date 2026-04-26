'use client'

import type { SnsRow } from '../AuditionApplyForm'

const SNS_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: '기타' },
] as const

type ApplySnsSectionProps = {
  snsRows: SnsRow[]
  blocked: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<SnsRow>) => void
}

export default function ApplySnsSection({ snsRows, blocked, onAdd, onRemove, onUpdate }: ApplySnsSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-neutral-900">SNS (선택)</h2>
        <button
          type="button"
          onClick={onAdd}
          disabled={blocked}
          className="shrink-0 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 disabled:opacity-50"
        >
          + SNS 추가
        </button>
      </div>
      <p className="mb-3 text-xs text-neutral-500">필수 아님 · 입력하지 않아도 지원할 수 있습니다.</p>
      <div className="flex flex-col gap-3">
        {snsRows.length === 0 ? (
          <p className="text-sm text-neutral-400">등록된 SNS 링크가 없습니다.</p>
        ) : null}
        {snsRows.map((row, index) => (
          <div
            key={index}
            className="flex min-[480px]:flex-row min-[480px]:items-end flex-col gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3"
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-600">플랫폼</span>
              <select
                value={row.platform}
                onChange={(e) => onUpdate(index, { platform: e.target.value })}
                disabled={blocked}
                className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm disabled:bg-neutral-100"
              >
                {SNS_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-[2] flex-col gap-1">
              <span className="text-xs font-medium text-neutral-600">URL</span>
              <input
                type="url"
                value={row.url}
                onChange={(e) => onUpdate(index, { url: e.target.value })}
                disabled={blocked}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm disabled:bg-neutral-100"
                placeholder="https://"
              />
            </label>
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={blocked}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-red-600 min-[480px]:mb-0"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
