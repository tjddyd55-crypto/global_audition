'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useLocale, useTranslations } from 'next-intl'
import { privacyApi } from '@/shared/api/privacy'
import { meProfileApi } from '@/shared/api/meProfile'
import {
  GENDER_CODES,
  GUARDIAN_LINK_DAYS,
  GUARDIAN_RELATIONSHIPS,
  birthDateProblem,
  guardianLink,
  guardianStatusOf,
  privacyErrorCode,
  toggleBlockReason,
  type PrivacySettings,
  type PrivacyToggle,
} from '@/shared/privacy/model'
import { CARD_BASE, INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const EXPOSURE: PrivacyToggle[] = ['channelPublic', 'talentSearchVisible', 'castingOffersEnabled']
const FIELDS: PrivacyToggle[] = ['showAge', 'showGender', 'showNationality', 'showResidence', 'showBio', 'showCareer', 'showSns']
const QUERY_KEY = ['me', 'privacy'] as const

/** 마이프로필 > 개인정보 및 공개 설정. 네이티브 app/privacy.tsx 와 같은 항목·순서·서버 판정. */
export default function StudioPrivacyPage() {
  const t = useTranslations('privacy')
  const tc = useTranslations('consent')
  const locale = useLocale()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: privacyApi.get })
  const [draft, setDraft] = useState<PrivacySettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [guardianName, setGuardianName] = useState('')
  const [relationship, setRelationship] = useState<string>('PARENT')
  const [link, setLink] = useState<{ url: string; expiresAt: string | null } | null>(null)
  const [copied, setCopied] = useState(false)
  const [birth, setBirth] = useState('')

  useEffect(() => {
    if (query.data) setDraft(query.data)
  }, [query.data])

  const s = draft
  const errorText = (e: unknown) => {
    const code = axios.isAxiosError(e) ? privacyErrorCode(e.response?.data) : null
    return code ? t(`errors.${code}`) : t('saveFailed')
  }
  const apply = (next: PrivacySettings) => {
    qc.setQueryData(QUERY_KEY, next)
    setDraft(next)
  }
  const flip = (key: PrivacyToggle) => setDraft((cur) => (cur ? { ...cur, [key]: !cur[key] } : cur))
  const dateText = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale) : '')

  if (query.isLoading || (!s && !query.isError)) return <p className={TEXT_SUB}>…</p>
  if (!s) return <p className="text-sm text-red-700">{t('loadFailed')}</p>

  const gStatus = guardianStatusOf(s)
  const showMinor = s.minor.minor || s.minor.guardianLegallyRequired
  const marketingOn = s.consents.some((c) => c.type === 'MARKETING' && c.status === 'AGREED')
  const disclosureOn = s.consents.some((c) => c.type === 'PRIVACY_DISCLOSURE' && c.status === 'AGREED')

  return (
    <div className="flex flex-col gap-5" data-testid="privacy-page">
      <div>
        <h1 className={TITLE_PAGE}>{t('menu')}</h1>
        <p className={`${TEXT_SUB} mt-1`}>{t('hint')}</p>
      </div>

      <section className={CARD_BASE}>
        <h2 className="mb-2 text-base font-bold text-gray-900">{t('sectionExposure')}</h2>
        {EXPOSURE.map((key) => {
          const block = toggleBlockReason(s, key)
          return (
            <Toggle
              key={key}
              id={`privacy-${key}`}
              label={t(key)}
              on={s[key]}
              disabled={Boolean(block) && !s[key]}
              warn={block && !s[key] ? t(`errors.${block}`) : undefined}
              onLabel={t('on')}
              offLabel={t('off')}
              onToggle={() => flip(key)}
            />
          )
        })}
        <p className="mt-2 text-xs text-gray-500">{t('separateNote')}</p>
      </section>

      <section className={CARD_BASE}>
        <h2 className="mb-2 text-base font-bold text-gray-900">{t('sectionFields')}</h2>
        {FIELDS.map((key) => (
          <Toggle key={key} id={`privacy-${key}`} label={t(key)} on={s[key]} onLabel={t('on')} offLabel={t('off')} onToggle={() => flip(key)} />
        ))}
        <label className="mt-3 grid gap-1 text-sm font-medium text-gray-800">
          {t('genderValue')}
          <select
            className={INPUT_BASE}
            value={s.gender ?? ''}
            onChange={(e) => setDraft((cur) => (cur ? { ...cur, gender: e.target.value || null } : cur))}
          >
            <option value="">{t('genderNone')}</option>
            {GENDER_CODES.map((g) => (
              <option key={g} value={g}>
                {t(`gender_${g}`)}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-gray-500">{t('fieldsHint')}</p>
        {note ? <p className="mt-2 text-sm text-purple-700" role="status">{note}</p> : null}
        <button
          type="button"
          data-testid="privacy-save"
          disabled={saving}
          className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={async () => {
            setSaving(true)
            setNote(null)
            try {
              const body: Record<string, unknown> = { gender: s.gender ?? '' }
              for (const k of [...EXPOSURE, ...FIELDS]) body[k] = s[k]
              apply(await privacyApi.save(body))
              setNote(t('saved'))
            } catch (e) {
              setNote(errorText(e))
            } finally {
              setSaving(false)
            }
          }}
        >
          {t('save')}
        </button>
      </section>

      {!s.birthDateSet ? (
        <section className={CARD_BASE}>
          <p className="text-sm text-gray-600">{t('birthDateMissing')}</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm font-medium">
              {tc('birthDate')}
              <input type="date" className={INPUT_BASE} value={birth} onChange={(e) => setBirth(e.target.value)} />
            </label>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
              onClick={async () => {
                const p = birthDateProblem(birth)
                if (p) {
                  setNote(tc(p === 'required' ? 'birthDateRequired' : 'birthDateInvalid'))
                  return
                }
                try {
                  await meProfileApi.patch({ birthDate: birth })
                  apply(await privacyApi.get())
                } catch (e) {
                  setNote(errorText(e))
                }
              }}
            >
              {t('save')}
            </button>
          </div>
        </section>
      ) : null}

      {showMinor ? (
        <section className={CARD_BASE} data-testid="privacy-minor">
          <h2 className="text-base font-bold text-gray-900">{t('sectionMinor')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('minorNotice')}</p>
          <p className="mt-2 text-xs text-gray-500">
            {t('policyLine', {
              country: s.minor.policyCountry,
              adult: String(s.minor.adultAge),
              under: String(s.minor.guardianConsentUnderAge),
            })}
          </p>
          <p className="mt-2 font-semibold text-purple-700" data-testid="guardian-status">
            {t('guardianStatus')}: {t.has(`guardianStatus_${gStatus}`) ? t(`guardianStatus_${gStatus}`) : gStatus}
          </p>
          {s.minor.guardianLegallyRequired && !s.minor.guardianConfirmed ? (
            <p className="mt-1 text-sm text-red-700">{t('guardianRequiredApply')}</p>
          ) : null}
          {!s.minor.offersAllowed ? <p className="mt-1 text-sm text-red-700">{t('guardianRequiredOffers')}</p> : null}
          {!s.minor.contactSharingAllowed ? <p className="mt-1 text-xs text-gray-500">{t('contactRestricted')}</p> : null}
          {s.minor.guardianLegallyRequired && !s.minor.guardianConfirmed ? <p className="mt-1 text-xs text-gray-500">{t('paymentGuardian')}</p> : null}
          {s.minor.guardianLegallyRequired && !s.minor.guardianConfirmed ? (
            <div className="mt-3 grid gap-2 md:max-w-md">
              <label className="grid gap-1 text-sm font-medium">
                {t('guardianName')}
                <input className={INPUT_BASE} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                {t('relationship')}
                <select className={INPUT_BASE} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  {GUARDIAN_RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {t(`rel_${r}`)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                data-testid="guardian-create-link"
                className="rounded-lg border border-purple-600 px-4 py-2 text-sm font-semibold text-purple-700"
                onClick={async () => {
                  setNote(null)
                  try {
                    const issued = await privacyApi.requestGuardian({ guardianName: guardianName.trim() || undefined, relationship })
                    setLink({ url: guardianLink(window.location.origin, locale, issued.token), expiresAt: issued.expiresAt })
                    setCopied(false)
                    apply(await privacyApi.get())
                  } catch (e) {
                    setNote(errorText(e))
                  }
                }}
              >
                {gStatus === 'PENDING' ? t('renewLink') : t('createLink')}
              </button>
            </div>
          ) : null}
          {link ? (
            <div className="mt-3 grid gap-2 rounded-lg bg-purple-50 p-3" data-testid="guardian-link">
              <p className="text-xs text-gray-600">{t('linkCreated', { days: String(GUARDIAN_LINK_DAYS) })}</p>
              <code className="break-all text-xs text-purple-800">{link.url}</code>
              {link.expiresAt ? <p className="text-xs text-gray-500">{t('linkExpires', { date: dateText(link.expiresAt) })}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link.url)
                      setCopied(true)
                    } catch {
                      setCopied(false)
                    }
                  }}
                >
                  {copied ? t('copied') : t('copyLink')}
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator ? (
                  <button
                    type="button"
                    className="rounded-lg border border-purple-600 px-3 py-1.5 text-sm font-semibold text-purple-700"
                    onClick={() => void navigator.share({ text: t('shareMessage'), url: link.url }).catch(() => undefined)}
                  >
                    {t('shareLink')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={CARD_BASE}>
        <h2 className="mb-2 text-base font-bold text-gray-900">{t('sectionConsents')}</h2>
        {s.consents.length === 0 ? <p className="text-sm text-gray-500">{t('consentNone')}</p> : null}
        <ul className="grid gap-1 text-sm text-gray-700">
          {s.consents.map((c) => (
            <li key={c.type}>
              {t.has(`consentType_${c.type}`) ? t(`consentType_${c.type}`) : c.type} ·{' '}
              {t.has(`consentStatus_${c.status}`) ? t(`consentStatus_${c.status}`) : c.status} · {dateText(c.status === 'WITHDRAWN' ? c.withdrawnAt : c.agreedAt)}
              {c.termsVersion ? ` · ${t('consentVersion', { version: c.termsVersion })}` : ''}
            </li>
          ))}
        </ul>
        <Toggle
          id="privacy-marketing"
          label={t('marketingToggle')}
          on={marketingOn}
          onLabel={t('on')}
          offLabel={t('off')}
          onToggle={async () => {
            try {
              apply(await privacyApi.consent('MARKETING', !marketingOn))
            } catch (e) {
              setNote(errorText(e))
            }
          }}
        />
        {disclosureOn ? (
          <div className="mt-2">
            <p className="text-xs text-gray-500">{t('withdrawDisclosureNote')}</p>
            <button
              type="button"
              className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              onClick={async () => {
                try {
                  apply(await privacyApi.consent('PRIVACY_DISCLOSURE', false))
                } catch (e) {
                  setNote(errorText(e))
                }
              }}
            >
              {t('withdrawDisclosure')}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Toggle({
  id,
  label,
  warn,
  on,
  disabled,
  onToggle,
  onLabel,
  offLabel,
}: {
  id: string
  label: string
  warn?: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
  onLabel: string
  offLabel: string
}) {
  return (
    <div className={`flex items-center gap-3 py-2 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-semibold text-gray-900">
          {label}
        </label>
        {warn ? <p className="text-xs text-red-700">{warn}</p> : null}
      </div>
      <span className="text-xs text-gray-500">{on ? onLabel : offLabel}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        data-testid={id}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-purple-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}
