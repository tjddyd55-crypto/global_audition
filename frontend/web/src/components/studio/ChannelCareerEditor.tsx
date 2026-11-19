'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { channelApi, type ChannelCareer, type ChannelCareerCategory, type ChannelCareerInput } from '@/shared/api/channel'
import { CAREER_CATEGORIES, formatCareerPeriod } from '@/shared/channel/discovery'
import { INPUT_BASE, TEXT_SUB } from '@/shared/ui/specClasses'

const EMPTY: ChannelCareerInput = {
  category: 'PERFORMANCE',
  title: '',
  organization: '',
  periodStart: '',
  periodEnd: '',
  description: '',
  visible: true,
}

/** 내 채널 > 활동 경력 CRUD. 경력이 없어도 채널 운영 가능. */
export function ChannelCareerEditor() {
  const t = useTranslations('studio')
  const tChannel = useTranslations('channel')
  const locale = useLocale()
  const qc = useQueryClient()
  const careers = useQuery({ queryKey: ['studio', 'careers'], queryFn: channelApi.listMyCareers })
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<ChannelCareerInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => qc.invalidateQueries({ queryKey: ['studio', 'careers'] })
  const save = useMutation({
    mutationFn: () => {
      const body: ChannelCareerInput = { ...draft, sourceLocale: locale }
      return editing && editing !== 'new' ? channelApi.updateCareer(editing, body) : channelApi.createCareer(body)
    },
    onSuccess: async () => {
      setEditing(null)
      setError(null)
      await refresh()
    },
    onError: () => setError(t('careerInvalid')),
  })
  const remove = useMutation({ mutationFn: (id: string) => channelApi.deleteCareer(id), onSuccess: refresh })
  const toggle = useMutation({
    mutationFn: (c: ChannelCareer) => channelApi.updateCareer(c.id, { visible: !c.visible }),
    onSuccess: refresh,
  })

  const startEdit = (c?: ChannelCareer) => {
    setError(null)
    setEditing(c ? c.id : 'new')
    setDraft(
      c
        ? {
            category: c.category,
            title: c.title,
            organization: c.organization ?? '',
            periodStart: c.periodStart ?? '',
            periodEnd: c.periodEnd ?? '',
            description: c.description ?? '',
            visible: c.visible,
          }
        : EMPTY,
    )
  }

  const rows = careers.data ?? []
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4" data-testid="studio-careers">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{t('careersTitle')}</h3>
        {editing === null ? (
          <button type="button" onClick={() => startEdit()} className="h-9 rounded-full border border-neutral-300 px-3 text-sm font-semibold" data-testid="career-add">
            {t('careerAdd')}
          </button>
        ) : null}
      </div>
      {rows.length === 0 && editing === null ? <p className={TEXT_SUB}>{t('careerEmpty')}</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((c) =>
          editing === c.id ? null : (
            <li key={c.id} className="flex min-w-0 flex-wrap items-start justify-between gap-2 rounded-lg bg-neutral-50 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-500">{tChannel(`careerCategory.${c.category}`)}</p>
                <p className="break-words text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-neutral-500">
                  {[c.organization, formatCareerPeriod(c.periodStart, c.periodEnd, tChannel('present'))].filter(Boolean).join(' · ')}
                  {!c.visible ? ` · ${t('careerHidden')}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="h-8 rounded-full border px-2 text-xs" onClick={() => toggle.mutate(c)}>
                  {c.visible ? t('makePrivate') : t('makePublic')}
                </button>
                <button type="button" className="h-8 rounded-full border px-2 text-xs" onClick={() => startEdit(c)}>
                  {t('careerEdit')}
                </button>
                <button
                  type="button"
                  className="h-8 rounded-full border border-red-200 px-2 text-xs text-red-700"
                  onClick={() => remove.mutate(c.id)}
                >
                  {t('careerDelete')}
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing !== null ? (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-violet-200 p-3 sm:grid-cols-2" data-testid="career-form">
          <label className="text-sm font-medium">
            {t('careerCategoryLabel')}
            <select
              className={INPUT_BASE}
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as ChannelCareerCategory })}
            >
              {CAREER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tChannel(`careerCategory.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            {t('careerTitle')}
            <input className={INPUT_BASE} maxLength={120} value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="text-sm font-medium">
            {t('careerOrg')}
            <input className={INPUT_BASE} maxLength={120} value={draft.organization ?? ''} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-medium">
              {t('careerStart')}
              <input className={INPUT_BASE} placeholder="2023-03" maxLength={7} value={draft.periodStart ?? ''} onChange={(e) => setDraft({ ...draft, periodStart: e.target.value })} />
            </label>
            <label className="text-sm font-medium">
              {t('careerEnd')}
              <input className={INPUT_BASE} placeholder="2024" maxLength={7} value={draft.periodEnd ?? ''} onChange={(e) => setDraft({ ...draft, periodEnd: e.target.value })} />
            </label>
          </div>
          <label className="text-sm font-medium sm:col-span-2">
            {t('careerDesc')}
            <textarea className={INPUT_BASE} rows={3} maxLength={1000} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.visible !== false} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} />
            {t('careerVisible')}
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="h-9 rounded-full border px-4 text-sm" onClick={() => setEditing(null)}>
              {t('careerCancel')}
            </button>
            <button
              type="button"
              disabled={save.isPending || !(draft.title ?? '').trim()}
              onClick={() => save.mutate()}
              className="h-9 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
              data-testid="career-save"
            >
              {t('careerSave')}
            </button>
          </div>
          {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
