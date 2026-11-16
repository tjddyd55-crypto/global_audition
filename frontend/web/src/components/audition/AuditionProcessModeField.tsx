'use client'

/**
 * 기획사 공고 등록·수정: 진행 방식(단일 / 여러 회차). 기획사 화면은 한국어 전용 정책이라 문구를 카탈로그에 두지 않는다.
 * 시리즈(2차 공고·3차 공고…)는 등록 시 고르는 값이 아니라, 게시된 단일 공고에서 '다음 차수 공고'로 이어 만든다.
 */
export type ProcessMode = 'SINGLE' | 'MULTI_ROUND'

const COPY = {
  title: '진행 방식',
  options: {
    SINGLE: {
      label: '단일 진행',
      desc: '한 번의 모집으로 진행합니다. 다음 차수가 필요하면 게시 후 "다음 차수 공고"로 이어 올립니다. 투표 설정의 회차는 차수 공고(1차 공고, 2차 공고…)를 뜻합니다.',
    },
    MULTI_ROUND: {
      label: '여러 회차 진행',
      desc: '한 공고 안에서 1차·2차·3차… 회차를 이어서 진행합니다. 투표 설정의 회차는 이 공고의 회차를 뜻합니다.',
    },
  } as Record<ProcessMode, { label: string; desc: string }>,
  locked: '게시된 공고는 진행 방식을 바꿀 수 없습니다.',
}

export function normalizeProcessMode(raw: string | null | undefined): ProcessMode {
  return raw === 'MULTI_ROUND' ? 'MULTI_ROUND' : 'SINGLE'
}

export function AuditionProcessModeField({
  value,
  onChange,
  locked,
}: {
  value: ProcessMode
  onChange: (next: ProcessMode) => void
  /** 수정 화면에서 게시 이후에는 저장된 값만 보여 준다. */
  locked?: boolean
}) {
  return (
    <fieldset className="mb-6 rounded-xl border border-gray-200 p-4" data-testid="process-mode-field" disabled={locked}>
      <legend className="px-1 text-sm font-semibold text-gray-900">{COPY.title}</legend>
      <div className="flex flex-col gap-2 sm:flex-row">
        {(['SINGLE', 'MULTI_ROUND'] as const).map((m) => {
          const on = value === m
          return (
            <label
              key={m}
              className={`flex flex-1 cursor-pointer gap-2 rounded-lg border p-3 text-sm ${
                on ? 'border-violet-500 bg-violet-50' : 'border-gray-300 bg-white'
              } ${locked ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              <input
                type="radio"
                name="processMode"
                value={m}
                checked={on}
                data-testid={`process-mode-${m}`}
                onChange={() => onChange(m)}
                className="mt-0.5"
              />
              <span>
                <span className="block font-semibold text-gray-900">{COPY.options[m].label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-gray-600">{COPY.options[m].desc}</span>
              </span>
            </label>
          )
        })}
      </div>
      {locked ? (
        <p className="mt-2 text-xs text-gray-500" data-testid="process-mode-locked">
          {COPY.locked}
        </p>
      ) : null}
    </fieldset>
  )
}
