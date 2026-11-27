'use client'

import { useState, type CSSProperties, type MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { useSavedAuditionIds, useToggleSavedAudition } from '@/shared/saves/useSavedAuditions'

const HEART_RED = '#E11D48'
const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

const CLEAR: CSSProperties = {
  background: 'transparent',
  backgroundColor: 'transparent',
  boxShadow: 'none',
  filter: 'none',
  border: 'none',
  borderRadius: 0,
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
}

type Tone = 'onImage' | 'onSurface'

type Props = {
  auditionId: string
  className?: string
  tone?: Tone
}

export default function SaveAuditionButton({ auditionId, className = '', tone = 'onSurface' }: Props) {
  const t = useTranslations('savedAuditions')
  const tCommon = useTranslations('common')
  const { isAuthenticated, saved } = useSavedAuditionIds()
  const toggle = useToggleSavedAudition()
  const [loginOpen, setLoginOpen] = useState(false)
  const isSaved = saved.has(auditionId)

  const onClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isAuthenticated) {
      setLoginOpen(true)
      return
    }
    toggle.mutate({ auditionId, next: !isSaved })
  }

  return (
    <>
      <button
        type="button"
        data-testid="save-audition"
        data-tone={tone}
        aria-pressed={isSaved}
        aria-label={isSaved ? t('unsaveAria') : t('saveAria')}
        title={isSaved ? t('unsave') : t('save')}
        disabled={toggle.isPending}
        onClick={onClick}
        style={CLEAR}
        className={`inline-flex appearance-none items-center justify-center border-0 bg-transparent p-2 shadow-none ring-0 outline-none backdrop-blur-none hover:bg-transparent hover:shadow-none focus:bg-transparent focus-visible:bg-transparent focus-visible:outline-none focus-visible:ring-0 active:bg-transparent disabled:bg-transparent ${className}`}
      >
        <HeartIcon filled={isSaved} tone={tone} />
      </button>
      {loginOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-login-title"
          onClick={() => setLoginOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 text-neutral-900 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="save-login-title" className="text-sm leading-relaxed">
              {t('loginRequired')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                onClick={() => setLoginOpen(false)}
              >
                {tCommon('close')}
              </button>
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white no-underline"
              >
                {t('loginAction')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {toggle.isError ? (
        <span className="sr-only" role="alert">
          {t('toggleFailed')}
        </span>
      ) : null}
    </>
  )
}

function HeartIcon({ filled, tone }: { filled: boolean; tone: Tone }) {
  const outline = tone === 'onImage' ? '#FFFFFF' : '#111827'
  const color = filled ? HEART_RED : outline
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      className="block h-5 w-5 shrink-0"
      style={{ aspectRatio: '1 / 1', flexShrink: 0, overflow: 'visible', filter: 'none' }}
      aria-hidden
    >
      {tone === 'onImage' ? (
        <path
          d={HEART_PATH}
          fill="none"
          stroke="#111827"
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={HEART_PATH}
        fill={filled ? HEART_RED : 'none'}
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
