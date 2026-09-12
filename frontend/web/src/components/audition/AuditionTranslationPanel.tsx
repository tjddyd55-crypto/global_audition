'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { auditionApi } from '@/shared/api/auditions'
import { bindCatalogTranslator, mapDisplayError } from '@/shared/i18n/mapDisplayError'
import type { AuditionTranslationView } from '@/shared/api/auditions/translations'
import { CONTENT_LOCALES, type ContentLocale } from '@/shared/audition/audience'
import { AUDITION_DETAIL, HERO, SIGNUP } from '@/shared/design-tokens'

type Draft = {
  title: string
  description: string
  location: string
  agencyName: string
  recruitFields: string
  qualifications: string
  schedules: string
  benefits: string
}

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  location: '',
  agencyName: '',
  recruitFields: '',
  qualifications: '',
  schedules: '',
  benefits: '',
}

function linesToList(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function listToLines(values?: string[] | null): string {
  return (values ?? []).join('\n')
}

function isComplete(row: AuditionTranslationView | undefined): boolean {
  return row?.status === 'COMPLETED' && Boolean(row.title?.trim())
}

function fromView(row?: AuditionTranslationView): Draft {
  if (!row) return { ...EMPTY_DRAFT }
  return {
    title: row.title ?? '',
    description: row.description ?? '',
    location: row.location ?? '',
    agencyName: row.agencyName ?? '',
    recruitFields: listToLines(row.recruitFields),
    qualifications: listToLines(row.qualifications),
    schedules: listToLines(row.schedules),
    benefits: listToLines(row.benefits),
  }
}

type Props = {
  auditionId: string
  defaultLocale: string
}

export function AuditionTranslationPanel({ auditionId, defaultLocale }: Props) {
  const t = useTranslations('editor')
  const tLocale = useTranslations('locale')
  const tUploader = useTranslations('uploader')
  const tErrors = useTranslations('errors')
  const translateError = bindCatalogTranslator({ uploader: tUploader, errors: tErrors })
  const queryClient = useQueryClient()
  const [active, setActive] = useState<ContentLocale>(() =>
    CONTENT_LOCALES.includes(defaultLocale as ContentLocale) ? (defaultLocale as ContentLocale) : 'en',
  )
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const query = useQuery({
    queryKey: ['audition-translations', auditionId],
    queryFn: () => auditionApi.listTranslations(auditionId),
    enabled: Boolean(auditionId),
  })

  const byLocale = useMemo(() => {
    const map = new Map<string, AuditionTranslationView>()
    for (const row of query.data ?? []) {
      map.set(row.locale, row)
    }
    return map
  }, [query.data])

  useEffect(() => {
    setDraft(fromView(byLocale.get(active)))
  }, [active, byLocale])

  const saveMut = useMutation({
    mutationFn: () =>
      auditionApi.upsertTranslation(auditionId, active, {
        title: draft.title.trim(),
        description: draft.description,
        location: draft.location,
        agencyName: draft.agencyName,
        recruitFields: linesToList(draft.recruitFields),
        qualifications: linesToList(draft.qualifications),
        schedules: linesToList(draft.schedules),
        benefits: linesToList(draft.benefits),
      }),
    onSuccess: async () => {
      toast.success(t('translationSaved'))
      await queryClient.invalidateQueries({ queryKey: ['audition-translations', auditionId] })
    },
    onError: (err) => {
      toast.error(mapDisplayError(err, translateError, t('translationSaveFailed')))
    },
  })

  const setField = (key: keyof Draft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <section
      className="mt-8 rounded-xl border border-gray-200 bg-white p-4"
      data-testid="audition-translation-panel"
    >
      <div className="mb-3">
        <h2 className="text-lg font-bold">{t('translationTitle')}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('translationHint', { locale: tLocale(defaultLocale as 'ko') })}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CONTENT_LOCALES.map((code) => {
          const complete = isComplete(byLocale.get(code))
          const selected = active === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => setActive(code)}
              className={`min-h-11 min-w-[7.5rem] whitespace-normal break-words rounded-full px-3 py-2 text-sm font-semibold leading-tight ${
                selected ? 'text-white' : 'border border-gray-300 bg-gray-50 text-gray-800'
              }`}
              style={
                selected
                  ? { background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})` }
                  : undefined
              }
            >
              {tLocale(code)} · {complete ? t('translationComplete') : t('translationMissing')}
            </button>
          )
        })}
      </div>

      {query.isError ? <p className="mb-3 text-sm text-red-600">{t('translationLoadFailed')}</p> : null}

      <div className="grid gap-3">
        <Field label={t('title')} required>
          <input
            value={draft.title}
            onChange={(e) => setField('title', e.target.value)}
            className="w-full rounded-lg border px-3"
            style={{ height: SIGNUP.inputHeightPx, borderColor: SIGNUP.inputBorderColor }}
          />
        </Field>
        <Field label={t('description')}>
          <textarea
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            rows={4}
            style={{ borderColor: SIGNUP.inputBorderColor }}
          />
        </Field>
        <Field label={t('location')}>
          <input
            value={draft.location}
            onChange={(e) => setField('location', e.target.value)}
            className="w-full rounded-lg border px-3"
            style={{ height: SIGNUP.inputHeightPx, borderColor: SIGNUP.inputBorderColor }}
          />
        </Field>
        <Field label={t('agencyName')}>
          <input
            value={draft.agencyName}
            onChange={(e) => setField('agencyName', e.target.value)}
            className="w-full rounded-lg border px-3"
            style={{ height: SIGNUP.inputHeightPx, borderColor: SIGNUP.inputBorderColor }}
          />
        </Field>
        <Field label={`${t('recruitFields')} (${t('onePerLine')})`}>
          <textarea value={draft.recruitFields} onChange={(e) => setField('recruitFields', e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2" />
        </Field>
        <Field label={`${t('qualifications')} (${t('onePerLine')})`}>
          <textarea value={draft.qualifications} onChange={(e) => setField('qualifications', e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2" />
        </Field>
        <Field label={`${t('schedules')} (${t('onePerLine')})`}>
          <textarea value={draft.schedules} onChange={(e) => setField('schedules', e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2" />
        </Field>
        <Field label={`${t('benefits')} (${t('onePerLine')})`}>
          <textarea value={draft.benefits} onChange={(e) => setField('benefits', e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2" />
        </Field>
      </div>

      <button
        type="button"
        disabled={saveMut.isPending || !draft.title.trim()}
        onClick={() => saveMut.mutate()}
        className="mt-4 min-h-11 whitespace-normal break-words rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
        style={{
          background: saveMut.isPending || !draft.title.trim()
            ? undefined
            : `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
        }}
      >
        {saveMut.isPending ? t('saving') : t('saveTranslation')}
      </button>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block min-w-0 whitespace-normal break-words text-sm font-semibold" style={{ fontSize: AUDITION_DETAIL.bodyFontPx }}>
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      {children}
    </label>
  )
}
