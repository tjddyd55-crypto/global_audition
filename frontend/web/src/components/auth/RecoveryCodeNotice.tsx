'use client'

import { useState } from 'react'

type Props = {
  recoveryCode: string
  onAcknowledged: () => void
}

export function RecoveryCodeNotice({ recoveryCode, onAcknowledged }: Props) {
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-5">
      <h2 className="text-lg font-bold text-gray-900">복구 보안 코드를 저장하세요</h2>
      <p className="text-sm leading-6 text-gray-700">
        이 코드는 <strong>지금 한 번만</strong> 보여 줍니다. 비밀번호를 잊었을 때 계정 확인과 재설정에 사용합니다.
        서버는 해시만 보관하며 이전 비밀번호는 절대 돌려주지 않습니다.
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
        {copied ? '복사됨' : '코드 복사'}
      </button>
      <label className="flex items-start gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1" />
        안전한 곳에 코드를 저장했고, 다시 볼 수 없음을 이해했습니다.
      </label>
      <button
        type="button"
        disabled={!saved}
        onClick={onAcknowledged}
        className="min-h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 font-semibold text-white disabled:opacity-50"
      >
        확인 후 계속
      </button>
    </div>
  )
}
