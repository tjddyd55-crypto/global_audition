'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { guardianPublicApi, type GuardianPublic } from '@/shared/api/privacy'
import { GUARDIAN_RELATIONSHIPS } from '@/shared/privacy/model'

const codeOf = (e: unknown): string => {
  if (!axios.isAxiosError(e)) return ''
  const b = e.response?.data as { message?: unknown; code?: unknown } | undefined
  for (const v of [b?.code, b?.message]) if (typeof v === 'string') return v
  return ''
}

/**
 * 보호자 확인(공유 링크). 로그인 불필요. 미성년자 본인 세션이면 서버가 GUARDIAN_SELF_CONFIRM_FORBIDDEN 으로 막는다.
 * 이메일·문자 발송 없음(유료 서비스 미사용). 확인 방식 강도는 정책 결정 항목.
 */
export default function GuardianConfirmPage() {
  const t = useTranslations('guardian')
  const tp = useTranslations('privacy')
  const params = useParams<{ token: string }>()
  const token = String(params?.token ?? '')
  const [view, setView] = useState<GuardianPublic | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState<string>('PARENT')
  const [agree, setAgree] = useState({ guardian: false, terms: false, privacy: false })

  useEffect(() => {
    let alive = true
    guardianPublicApi
      .view(token)
      .then((v) => alive && setView(v))
      .catch(() => alive && setFatal(t('notFound')))
    return () => {
      alive = false
    }
  }, [token, t])

  const message = (e: unknown) => {
    const code = codeOf(e)
    if (code === 'GUARDIAN_SELF_CONFIRM_FORBIDDEN') return t('selfForbidden')
    if (code === 'GUARDIAN_LINK_NOT_PENDING' || code === 'GUARDIAN_NOT_CONFIRMED') return t('notPending')
    if (code === 'GUARDIAN_NAME_REQUIRED') return t('nameRequired')
    if (code === 'GUARDIAN_LINK_NOT_FOUND') return t('notFound')
    return tp('saveFailed')
  }

  const allAgreed = agree.guardian && agree.terms && agree.privacy

  return (
    <main className="mx-auto max-w-lg px-4 py-10" data-testid="guardian-page">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      {fatal ? <p className="mt-4 text-sm text-red-700">{fatal}</p> : null}
      {!view && !fatal ? <p className="mt-4 text-sm text-gray-500">{t('loading')}</p> : null}
      {view ? (
        <div className="mt-4 grid gap-4">
          <p className="text-base text-gray-800">{t('intro', { nickname: view.minorNickname ?? '' })}</p>
          <p className="text-sm leading-6 text-gray-600">{t('what')}</p>
          <p className="text-xs text-gray-500">{t('method')}</p>
          <p className="text-sm font-semibold text-purple-700" data-testid="guardian-status">
            {tp('guardianStatus')}: {tp.has(`guardianStatus_${view.status}`) ? tp(`guardianStatus_${view.status}`) : view.status}
          </p>
          {done ? (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
              {done}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert" data-testid="guardian-error">
              {error}
            </p>
          ) : null}

          {view.status === 'PENDING' ? (
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                setError(null)
                if (!name.trim()) {
                  setError(t('nameRequired'))
                  return
                }
                setBusy(true)
                try {
                  const next = await guardianPublicApi.confirm(token, {
                    guardianName: name.trim(),
                    relationship,
                    agreeGuardian: agree.guardian,
                    agreeTerms: agree.terms,
                    agreePrivacy: agree.privacy,
                  })
                  setView(next)
                  setDone(t('confirmed'))
                } catch (err) {
                  setError(message(err))
                } finally {
                  setBusy(false)
                }
              }}
            >
              <label className="grid gap-1 text-sm font-medium">
                {tp('guardianName')}
                <input
                  className="h-11 rounded-lg border border-gray-300 px-3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="guardian-name"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                {tp('relationship')}
                <select className="h-11 rounded-lg border border-gray-300 px-3" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  {GUARDIAN_RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {tp(`rel_${r}`)}
                    </option>
                  ))}
                </select>
              </label>
              {(['guardian', 'terms', 'privacy'] as const).map((k) => (
                <label key={k} className="flex items-start gap-2 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1"
                    data-testid={`guardian-agree-${k}`}
                    checked={agree[k]}
                    onChange={() => setAgree((a) => ({ ...a, [k]: !a[k] }))}
                  />
                  {t(k === 'guardian' ? 'agreeGuardian' : k === 'terms' ? 'agreeTerms' : 'agreePrivacy')}
                </label>
              ))}
              <button
                type="submit"
                disabled={!allAgreed || busy}
                data-testid="guardian-confirm"
                className="h-11 rounded-lg bg-purple-600 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t('confirm')}
              </button>
            </form>
          ) : null}

          {view.status === 'CONFIRMED' ? (
            <button
              type="button"
              disabled={busy}
              data-testid="guardian-revoke"
              className="h-11 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800"
              onClick={async () => {
                if (!window.confirm(t('revokeConfirm'))) return
                setBusy(true)
                setError(null)
                try {
                  setView(await guardianPublicApi.revoke(token))
                  setDone(t('revoked'))
                } catch (err) {
                  setError(message(err))
                } finally {
                  setBusy(false)
                }
              }}
            >
              {t('revoke')}
            </button>
          ) : null}
          {view.status !== 'PENDING' && view.status !== 'CONFIRMED' && !done ? (
            <p className="text-sm text-gray-600">{t('notPending')}</p>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}
