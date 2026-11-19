'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n.config'
import { agencyCastingApi } from '@/shared/api/casting'
import { channelApi } from '@/shared/api/channel'
import {
  COMPENSATION_TYPES,
  OFFER_ROLE_FIELDS,
  PROJECT_TYPES,
  WORK_COUNTRIES,
  deadlineBounds,
  draftProblems,
  emptyDraft,
  type CastingOffer,
  type OfferDraft,
} from '@/shared/casting/model'
import { apiErrorCode } from '@/shared/channel/apiErrorCode'
import { AgencyCastingGate } from '@/components/casting/AgencyGate'
import { AgencyOfferView } from '@/components/casting/AgencyOfferView'
import { koCompensation, koCountry, koError, koField, koProject } from '@/components/casting/agencyKo'

const INPUT = 'mt-1 w-full min-w-0 rounded-md border border-neutral-300 p-2 text-sm text-neutral-900'

export default function AgencyCastingComposePage() {
  const sp = useSearchParams()
  const talentId = sp?.get('talent') ?? ''
  return (
    <AgencyCastingGate title="캐스팅 제안 작성">
      {talentId ? <Compose talentId={talentId} /> : <p className="text-sm text-neutral-600">인재 검색이나 지원자 채널에서 &apos;제안하기&apos;를 눌러 주세요.</p>}
    </AgencyCastingGate>
  )
}

function Compose({ talentId }: { talentId: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [d, setD] = useState<OfferDraft>(() => emptyDraft(talentId, 'ko'))
  const [preview, setPreview] = useState<{ offer: CastingOffer; warnings: string[] } | null>(null)
  const [err, setErr] = useState('')
  const talent = useQuery({ queryKey: ['channel', 'public', talentId], queryFn: () => channelApi.getPublic(talentId) })
  const bounds = deadlineBounds()
  const set = (patch: Partial<OfferDraft>) => {
    setPreview(null)
    setD((cur) => ({ ...cur, ...patch }))
  }
  const check = () => {
    const p = draftProblems(d)
    if (p.length) {
      setErr(koError(p[0]))
      return false
    }
    setErr('')
    return true
  }
  const doPreview = useMutation({
    mutationFn: () => agencyCastingApi.preview(d),
    onSuccess: (r) => setPreview(r),
    onError: (e) => setErr(koError(apiErrorCode(e))),
  })
  const send = useMutation({
    mutationFn: () => agencyCastingApi.send(d),
    onSuccess: async (o) => {
      await qc.invalidateQueries({ queryKey: ['agency'] })
      router.push(`/my/casting/${o.id}`)
    },
    onError: (e) => setErr(koError(apiErrorCode(e))),
  })
  const name = talent.data?.nickname ?? ''
  const notAccepting = talent.data && talent.data.canSendCastingOffer === false

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        className="flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (check()) doPreview.mutate()
        }}
      >
        <p className="text-sm">
          받는 사람: <strong>{name || '—'}</strong>{' '}
          <Link href={`/channel/${talentId}`} className="text-xs text-violet-700 underline">
            채널 보기
          </Link>
        </p>
        {notAccepting ? <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">이 지원자는 현재 제안을 받을 수 없습니다.</p> : null}
        <Field label="제목 (필수)">
          <input className={INPUT} maxLength={120} value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="프로젝트 유형">
            <select className={INPUT} value={d.projectType} onChange={(e) => set({ projectType: e.target.value })}>
              {PROJECT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {koProject(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="분야">
            <select className={INPUT} value={d.roleField} onChange={(e) => set({ roleField: e.target.value })}>
              {OFFER_ROLE_FIELDS.map((p) => (
                <option key={p} value={p}>
                  {koField(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="활동 국가">
            <select className={INPUT} value={d.workCountry} onChange={(e) => set({ workCountry: e.target.value })}>
              {WORK_COUNTRIES.map((p) => (
                <option key={p} value={p}>
                  {koCountry(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="활동 도시·장소">
            <input className={INPUT} maxLength={120} value={d.workLocation} onChange={(e) => set({ workLocation: e.target.value })} />
          </Field>
          <Field label="일정">
            <input className={INPUT} maxLength={200} placeholder="예: 2027년 1~2월, 주 2회" value={d.scheduleText} onChange={(e) => set({ scheduleText: e.target.value })} />
          </Field>
          <Field label="응답 기한">
            <input type="date" className={INPUT} min={bounds.min} max={bounds.max} value={d.responseDeadline} onChange={(e) => set({ responseDeadline: e.target.value })} />
          </Field>
          <Field label="보수">
            <select className={INPUT} value={d.compensationType} onChange={(e) => set({ compensationType: e.target.value })}>
              {COMPENSATION_TYPES.map((p) => (
                <option key={p} value={p}>
                  {koCompensation(p)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="보수 메모">
            <input className={INPUT} maxLength={200} value={d.compensationNote} onChange={(e) => set({ compensationNote: e.target.value })} />
          </Field>
        </div>
        <Field label={`메시지 (필수, ${d.message.length}/2000)`}>
          <textarea className={INPUT} rows={6} maxLength={2000} value={d.message} onChange={(e) => set({ message: e.target.value })} />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={d.contactRequested} onChange={(e) => set({ contactRequested: e.target.checked })} />
          <span>지원자에게 이메일 공유를 요청합니다. 지원자가 수락하면서 따로 동의한 경우에만 공유됩니다.</span>
        </label>
        <p className="text-xs text-neutral-500">
          선입금·외부 결제 요구, 개인 연락처 강요는 금지이며 신고 대상입니다. 같은 지원자에게는 응답 대기 중 1건, 90일에 최대 3건, 거절 후 30일 동안 다시 보낼 수 없습니다.
        </p>
        {err ? <p className="text-sm text-red-600" role="alert">{err}</p> : null}
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white" disabled={doPreview.isPending}>
          미리보기
        </button>
      </form>
      <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4" aria-label="미리보기">
        <h2 className="text-sm font-semibold text-violet-900">지원자에게 보이는 내용</h2>
        {preview ? (
          <>
            <AgencyOfferView offer={preview.offer} talentName={name} />
            {preview.warnings.length ? (
              <ul className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                {preview.warnings.map((w) => (
                  <li key={w}>{koError(w)}</li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={send.isPending || preview.warnings.length > 0}
              onClick={() => send.mutate()}
            >
              제안 보내기
            </button>
          </>
        ) : (
          <p className="text-sm text-neutral-600">내용을 채우고 미리보기를 누르면 여기에서 확인한 뒤 보낼 수 있습니다.</p>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col text-xs text-neutral-600">
      {label}
      {children}
    </label>
  )
}
