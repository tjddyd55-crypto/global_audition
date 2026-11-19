'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Link } from '@/i18n.config'
import { myCastingApi } from '@/shared/api/casting'
import { DECLINE_REASONS, REPORT_REASONS, isOpenOffer } from '@/shared/casting/model'
import { apiErrorCode } from '@/shared/channel/apiErrorCode'
import { OfferFacts, OfferStatusBadge } from '@/components/casting/OfferFacts'
import { TEXT_SUB } from '@/shared/ui/specClasses'

type Panel = 'none' | 'accept' | 'decline' | 'report'

export default function StudioCastingDetailPage() {
  const t = useTranslations('casting')
  const locale = useLocale()
  const params = useParams<{ id: string }>()
  const id = String(params?.id ?? '')
  const qc = useQueryClient()
  const [panel, setPanel] = useState<Panel>('none')
  const [share, setShare] = useState(false)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState<string>('NOT_INTERESTED')
  const [reportReason, setReportReason] = useState<string>('SPAM')
  const [detail, setDetail] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(false)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')

  const offer = useQuery({ queryKey: ['me', 'casting-offer', id], queryFn: () => myCastingApi.offer(id), enabled: Boolean(id) })
  const done = async (msg: string) => {
    setPanel('none')
    setError('')
    setFlash(msg)
    await qc.invalidateQueries({ queryKey: ['me', 'casting-offer', id] })
    await qc.invalidateQueries({ queryKey: ['me', 'casting-offers'] })
    await qc.invalidateQueries({ queryKey: ['me', 'casting-blocks'] })
  }
  const fail = (e: unknown) => {
    const code = apiErrorCode(e)
    setError(t.has(`error.${code}`) ? t(`error.${code}`) : t('error.generic'))
  }
  const accept = useMutation({ mutationFn: () => myCastingApi.accept(id, share, note), onSuccess: () => done(t('accepted')), onError: fail })
  const decline = useMutation({ mutationFn: () => myCastingApi.decline(id, reason, note), onSuccess: () => done(t('declined')), onError: fail })
  const report = useMutation({
    mutationFn: () => myCastingApi.report(id, reportReason, detail, alsoBlock),
    onSuccess: () => done(t('reported')),
    onError: fail,
  })
  const block = useMutation({ mutationFn: () => myCastingApi.block(id), onSuccess: () => done(t('blocked')), onError: fail })

  const o = offer.data
  const open = o ? isOpenOffer(o) : false
  const busy = accept.isPending || decline.isPending || report.isPending || block.isPending

  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid="casting-detail">
      <Link href="/my/studio/casting" className="text-sm text-neutral-600 underline">
        ← {t('back')}
      </Link>
      {offer.isLoading ? <p className={TEXT_SUB}>{t('loading')}</p> : null}
      {offer.isError ? <p className="text-sm text-red-600">{t('error.OFFER_NOT_FOUND')}</p> : null}
      {o ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
            <OfferStatusBadge status={o.status} />
            <span className="min-w-0 break-words">
              {t('from')}: <strong>{o.agency?.name ?? '—'}</strong>
            </span>
            {o.agencyBlocked ? <span className="text-xs text-neutral-500">· {t('agencyBlockedBadge')}</span> : null}
          </div>
          <OfferFacts offer={o} />
          {o.contactRequested ? (
            <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">{o.contactShared ? t('contactShared') : t('contactRequested')}</p>
          ) : null}
          {o.status === 'WITHDRAWN' ? <p className="text-sm text-neutral-600">{t('withdrawnNotice')}</p> : null}
          {o.responseReason || o.responseNote ? (
            <p className="text-sm text-neutral-700">
              {t('responseLabel')}:{' '}
              {o.responseReason && t.has(`declineReason.${o.responseReason}`) ? t(`declineReason.${o.responseReason}`) : ''}
              {o.responseNote ? ` ${o.responseNote}` : ''}
            </p>
          ) : null}
          <p className="text-sm text-neutral-600">{t('intro')}</p>
          {flash ? <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800" role="status">{flash}</p> : null}
          {error ? <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700" role="alert">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            {open ? (
              <>
                <button type="button" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setPanel('accept')}>
                  {t('accept')}
                </button>
                <button type="button" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm" onClick={() => setPanel('decline')}>
                  {t('decline')}
                </button>
              </>
            ) : null}
            <button type="button" className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700" onClick={() => setPanel('report')}>
              {t('report')}
            </button>
            {!o.agencyBlocked ? (
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(t('blockConfirm'))) block.mutate()
                }}
              >
                {t('block')}
              </button>
            ) : null}
          </div>

          {panel === 'accept' ? (
            <section className="flex flex-col gap-2 rounded-xl border border-violet-200 p-3">
              <h3 className="font-semibold">{t('acceptTitle')}</h3>
              <p className="text-sm text-neutral-700">{t('acceptNotice')}</p>
              {o.contactRequested ? (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-1" />
                  <span>{t('shareContact')}</span>
                </label>
              ) : null}
              <NoteField label={t('noteLabel')} value={note} onChange={setNote} />
              <Actions busy={busy} onCancel={() => setPanel('none')} cancel={t('cancel')} confirm={t('confirmAccept')} onConfirm={() => accept.mutate()} />
            </section>
          ) : null}
          {panel === 'decline' ? (
            <section className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
              <h3 className="font-semibold">{t('declineTitle')}</h3>
              <label className="text-sm">
                {t('declineReasonLabel')}
                <select className="mt-1 block w-full rounded-md border border-neutral-300 p-2" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {DECLINE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`declineReason.${r}`)}
                    </option>
                  ))}
                </select>
              </label>
              <NoteField label={t('noteLabel')} value={note} onChange={setNote} />
              <Actions busy={busy} onCancel={() => setPanel('none')} cancel={t('cancel')} confirm={t('confirmDecline')} onConfirm={() => decline.mutate()} />
            </section>
          ) : null}
          {panel === 'report' ? (
            <section className="flex flex-col gap-2 rounded-xl border border-red-200 p-3">
              <h3 className="font-semibold">{t('reportTitle')}</h3>
              <label className="text-sm">
                {t('reportReasonLabel')}
                <select className="mt-1 block w-full rounded-md border border-neutral-300 p-2" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`reportReason.${r}`)}
                    </option>
                  ))}
                </select>
              </label>
              <NoteField label={t('reportDetail')} value={detail} onChange={setDetail} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />
                {t('reportBlock')}
              </label>
              <Actions busy={busy} onCancel={() => setPanel('none')} cancel={t('cancel')} confirm={t('confirmReport')} onConfirm={() => report.mutate()} />
            </section>
          ) : null}

          {o.history.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-neutral-900">{t('history')}</h3>
              <ol className="mt-1 flex flex-col gap-1 text-xs text-neutral-600">
                {o.history.map((e, i) => (
                  <li key={i}>
                    {e.createdAt ? new Date(e.createdAt).toLocaleString(locale) : ''} ·{' '}
                    {t.has(`actor.${e.actorKind}`) ? t(`actor.${e.actorKind}`) : e.actorKind} ·{' '}
                    {t.has(`status.${e.toStatus}`) ? t(`status.${e.toStatus}`) : e.toStatus}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function NoteField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm">
      {label}
      <textarea
        className="mt-1 block w-full rounded-md border border-neutral-300 p-2"
        rows={3}
        maxLength={500}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function Actions(props: { busy: boolean; onCancel: () => void; onConfirm: () => void; cancel: string; confirm: string }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" onClick={props.onCancel}>
        {props.cancel}
      </button>
      <button type="button" className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white" disabled={props.busy} onClick={props.onConfirm}>
        {props.confirm}
      </button>
    </div>
  )
}
