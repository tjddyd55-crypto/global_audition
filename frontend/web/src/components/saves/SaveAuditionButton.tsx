'use client'

import { useState, type MouseEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { useSavedAuditionIds, useToggleSavedAudition } from '@/shared/saves/useSavedAuditions'

type Props = {
  auditionId: string
  className?: string
}

export default function SaveAuditionButton({ auditionId, className = '' }: Props) {
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
        aria-pressed={isSaved}
        aria-label={isSaved ? t('unsaveAria') : t('saveAria')}
        title={isSaved ? t('unsave') : t('save')}
        disabled={toggle.isPending}
        onClick={onClick}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-black/45 text-white shadow-sm backdrop-blur-sm hover:bg-black/60 ${className}`}
      >
        <HeartIcon filled={isSaved} />
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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M12 20s-6.5-4.35-9.13-7.7C1.1 10.2 1.7 7.2 4.2 5.9c1.8-.95 3.95-.4 5.2 1.15C10.65 5.5 12.8 4.95 14.6 5.9c2.5 1.3 3.1 4.3 1.33 6.4C18.5 15.65 12 20 12 20z"
        fill={filled ? '#f472b6' : 'none'}
        stroke={filled ? '#f472b6' : 'currentColor'}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
