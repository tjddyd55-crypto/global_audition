'use client'

import { useEffect, useState } from 'react'

import { isInNativeAppShell } from '@/shared/device/appShell'

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'audition:install-prompt:dismissed-at'
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14일

/**
 * A2HS(홈 화면에 추가) 설치 프롬프트.
 *
 * 원칙:
 * - 사용자가 이미 닫았다면 TTL(14일) 동안 재노출하지 않는다.
 * - 이미 standalone 모드로 실행 중이면 그리지 않는다.
 * - iOS Safari는 `beforeinstallprompt`를 지원하지 않지만, 본 컴포넌트는 Chromium 계열 PWA에 집중한다.
 *   iOS 가이드 배너는 필요 시 별도 컴포넌트로 추가한다.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 네이티브 셸(앱) 안에서는 설치 개념이 없으므로 프롬프트를 노출하지 않는다.
    if (isInNativeAppShell()) return

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) return

    if (isRecentlyDismissed()) return

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!visible || !deferred) return null

  return (
    <div
      role="dialog"
      aria-label="앱 설치 안내"
      className="fixed inset-x-3 z-40 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg"
      style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">앱으로 설치하기</p>
          <p className="mt-1 text-xs text-neutral-600">
            홈 화면에 추가하면 더 빠르게 오디션을 확인할 수 있어요.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              markDismissed()
              setVisible(false)
            }}
            className="rounded-lg px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await deferred.prompt()
                await deferred.userChoice
              } finally {
                setVisible(false)
                setDeferred(null)
              }
            }}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            설치
          </button>
        </div>
      </div>
    </div>
  )
}

function isRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < DISMISS_TTL_MS
  } catch {
    return false
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  } catch {
    // storage 접근 실패 시 무시 (시크릿 모드 등)
  }
}
