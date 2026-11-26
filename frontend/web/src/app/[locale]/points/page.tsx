'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@/i18n.config'
import { useAuthStore } from '@/shared/auth/authStore'
import { pointsApi } from '@/shared/api/points'
import { pointActivityLabels, pointEntryLabels } from '@/shared/audition/points'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE } from '@/shared/ui/specClasses'

export default function PointsPage() {
  const t = useTranslations('points')
  const common = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const userId = useAuthStore(s => s.userId)
  const token = useAuthStore(s => s.accessToken)
  const cache = useQueryClient()
  const [page, setPage] = useState(0)
  const [inviteLink, setInviteLink] = useState('')
  const key = ['points', 'dashboard', userId] as const

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    if (!useAuthStore.getState().accessToken) router.replace('/login?next=/points')
  }, [router])

  const dashboard = useQuery({ queryKey: key, queryFn: pointsApi.dashboard, enabled: !!token })
  const entries = useQuery({ queryKey: ['points', 'entries', userId, page], queryFn: () => pointsApi.entries(page), enabled: !!token })
  const action = useMutation({
    mutationFn: (kind: 'checkIn' | 'confirmReferral') => pointsApi[kind](),
    onSuccess: data => {
      cache.setQueryData(key, data)
      void cache.invalidateQueries({ queryKey: ['points', 'entries', userId] })
      void cache.invalidateQueries({ queryKey: ['points', 'quote'] })
    },
  })
  const invite = useMutation({
    mutationFn: pointsApi.invite,
    onSuccess: code => setInviteLink(new URL('/' + locale + '/register?invite=' + code, window.location.origin).href),
  })
  const number = new Intl.NumberFormat(locale)
  const d = dashboard.data
  if (!d) return <main className="mx-auto max-w-4xl p-6">{dashboard.isError ? t('loadingError') : common('loading')}</main>
  const checked = d.attendance.includes(d.today)
  const checkIn = d.activities.some(a => a.activity === 'DAILY_CHECK_IN' || a.activity === 'MONTHLY_CHECK_IN')
  const canInvite = d.activities.some(a => a.activity === 'REFERRAL')

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <section className="grid grid-cols-2 gap-3">
        <Link href="/credits" className={CARD_BASE + ' p-4 text-gray-900 no-underline'}>
          <p className="text-sm">{t('credit')}</p><strong className="text-2xl">{number.format(d.quote.creditBalance)} C</strong>
        </Link>
        <div className={CARD_BASE + ' border-violet-200 bg-violet-50 p-4'}>
          <p className="text-sm">{t('balance')}</p><strong className="text-2xl text-violet-700">{number.format(d.quote.pointBalance)} P</strong>
        </div>
      </section>
      <p className="text-sm text-gray-600">{t('today')} {number.format(d.totals.earnedToday)} P · {t('month')} {number.format(d.totals.earnedMonth)} P</p>
      {d.quote.pointAllowed ? <p className="text-sm">{t('uses')}</p> : null}
      {checkIn || d.attendance.length > 0 ? (
        <section className={CARD_BASE + ' space-y-3 p-4'}>
          <h2 className="font-bold">{t('calendar')} · {number.format(d.attendance.length)}</h2>
          <p className="text-sm text-gray-600">{t('dateRule')}</p>
          <ul className="flex flex-wrap gap-2">
            {d.attendance.map(date => <li key={date} className="rounded bg-violet-50 px-2 py-1 text-sm">{date}</li>)}
          </ul>
          {checkIn ? <button type="button" className={BTN_PRIMARY} disabled={checked || action.isPending}
            onClick={() => action.mutate('checkIn')}>{t(checked ? 'checked' : 'checkIn')}</button> : null}
        </section>
      ) : null}
      <section className={CARD_BASE + ' space-y-3 p-4'}>
        <h2 className="font-bold">{t('activities')}</h2>
        {!d.activities.length ? <p className="text-sm text-gray-600">{t('unavailable')}</p> : null}
        <ul className="divide-y">
          {d.activities.map(a => (
            <li key={a.activity} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>{t(pointActivityLabels[a.activity])}</span>
              <span className="text-sm">{number.format(a.progress)} / {number.format(a.goal)} · +{number.format(a.award)} P</span>
            </li>
          ))}
        </ul>
        {canInvite ? (
          <div className="space-y-2">
            <button type="button" className={BTN_SECONDARY} disabled={invite.isPending} onClick={() => invite.mutate()}>{t('inviteShare')}</button>
            {inviteLink ? <input className="w-full rounded border p-2 text-sm" aria-label={t('invitation')} readOnly value={inviteLink}
              onFocus={e => e.currentTarget.select()} /> : null}
          </div>
        ) : null}
        {d.referralEligible ? (
          <div className="space-y-2">
            <p className="text-sm">{t('invitePending')}</p>
            <button type="button" className={BTN_SECONDARY} disabled={action.isPending} onClick={() => action.mutate('confirmReferral')}>{t('inviteCheck')}</button>
          </div>
        ) : null}
        {action.isError || invite.isError ? <p role="alert" className="text-sm text-red-700">{t('actionError')}</p> : null}
      </section>
      <section className={CARD_BASE + ' space-y-3 p-4'}>
        <h2 className="font-bold">{t('history')}</h2>
        {entries.isError ? <p role="alert">{t('loadingError')}</p> : null}
        {entries.isSuccess && !entries.data.length ? <p className="text-sm">{t('empty')}</p> : null}
        <ul className="divide-y">
          {entries.data?.map(row => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{t(row.activity ? pointActivityLabels[row.activity] : pointEntryLabels[row.kind])}</p>
                <time className="text-xs text-gray-600">{new Date(row.createdAt).toLocaleDateString(locale)}</time>
              </div>
              <strong className={row.amount > 0 ? 'text-violet-700' : 'text-gray-700'}>{row.amount > 0 ? '+' : ''}{number.format(row.amount)} P</strong>
            </li>
          ))}
        </ul>
        <nav className="flex gap-2">
          <button type="button" className={BTN_SECONDARY} disabled={page === 0} onClick={() => setPage(page - 1)}>{t('previous')}</button>
          <button type="button" className={BTN_SECONDARY} disabled={(entries.data?.length ?? 0) < 50} onClick={() => setPage(page + 1)}>{t('next')}</button>
        </nav>
      </section>
    </main>
  )
}
