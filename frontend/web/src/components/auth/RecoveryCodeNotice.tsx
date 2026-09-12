'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  recoveryCode: string
  onAcknowledged: () => void
}

export function RecoveryCodeNotice({ recoveryCode, onAcknowledged }: Props) {
  const t = useTranslations('auth')
  const tDetail = useTranslations('auditionDetail')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-5">
      <h2 className="text-lg font-bold text-gray-900">{t('recoverySaveTitle')}</h2>
      <p className="text-sm leading-6 text-gray-700">
        {t.rich('recoverySaveBody', {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <p className="break-all rounded-lg bg-white px-3 py-3 text-center font-mono text-xl font-bold tracking-wider text-violet-800">
        {recoveryCode}
      </p>
      <button
        type="button"
        className="min-h-11 w-full rounded-lg border border-violet-300 bg-white text-sm font-semibold text-violet-800"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(recoveryCode)
            setCopied(true)
          } catch {
            setCopied(false)
          }
        }}
      >
        {copied ? tDetail('copied') : t('copyCode')}
      </button>
      <label className="flex items-start gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1" />
        {t('recoveryAck')}
      </label>
      <button
        type="button"
        disabled={!saved}
        onClick={onAcknowledged}
        className="min-h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 font-semibold text-white disabled:opacity-50"
      >
        {t('continueAfterSave')}
      </button>
    </div>
  )
}
