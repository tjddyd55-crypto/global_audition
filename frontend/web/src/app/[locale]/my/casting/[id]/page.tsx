'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n.config'
import { agencyCastingApi } from '@/shared/api/casting'
import { isOpenOffer } from '@/shared/casting/model'
import { apiErrorCode } from '@/shared/channel/apiErrorCode'
import { AgencyCastingGate } from '@/components/casting/AgencyGate'
import { AgencyOfferView } from '@/components/casting/AgencyOfferView'
import { koActor, koDeclineReason, koError, koStatus } from '@/components/casting/agencyKo'

export default function AgencyCastingDetailPage() {
  const params = useParams<{ id: string }>()
  const id = String(params?.id ?? '')
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const offer = useQuery({ queryKey: ['agency', 'offer', id], queryFn: () => agencyCastingApi.offer(id), enabled: Boolean(id) })
  const withdraw = useMutation({
    mutationFn: () => agencyCastingApi.withdraw(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency'] }),
    onError: (e) => setErr(koError(apiErrorCode(e))),
  })
  const o = offer.data
  return (
    <AgencyCastingGate title="캐스팅 제안 상세">
      <Link href="/my/casting" className="text-sm text-neutral-600 underline">
        ← 목록으로
      </Link>
      {offer.isError ? <p className="text-sm text-red-600">제안을 찾을 수 없습니다.</p> : null}
      {o ? (
        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
          <AgencyOfferView offer={o} />
          {o.talent?.userId ? (
            <Link href={`/channel/${o.talent.userId}`} className="text-sm text-violet-700 underline">
              지원자 채널 보기
            </Link>
          ) : null}
          {o.status === 'ACCEPTED' ? (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
              지원자가 관심 있음으로 응답했습니다. 계약·지원서·결제는 생성되지 않았습니다.
              {o.contact?.email ? (
                <p className="mt-1">
                  공유된 이메일: <strong>{o.contact.email}</strong>
                </p>
              ) : (
                <p className="mt-1">지원자가 연락처 공유에 동의하지 않았습니다.</p>
              )}
              {o.responseNote ? <p className="mt-1">메시지: {o.responseNote}</p> : null}
            </div>
          ) : null}
          {o.status === 'DECLINED' ? (
            <p className="rounded-lg bg-neutral-100 p-3 text-sm">
              거절 사유: {koDeclineReason(o.responseReason) || '—'}
              {o.responseNote ? ` · ${o.responseNote}` : ''}
            </p>
          ) : null}
          {isOpenOffer(o) ? (
            <button
              type="button"
              className="self-start rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700"
              disabled={withdraw.isPending}
              onClick={() => {
                if (window.confirm('이 제안을 철회할까요? 지원자에게 철회 알림이 갑니다.')) withdraw.mutate()
              }}
            >
              제안 철회
            </button>
          ) : null}
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <section>
            <h3 className="text-sm font-semibold">진행 기록</h3>
            <ol className="mt-1 flex flex-col gap-1 text-xs text-neutral-600">
              {o.history.map((e, i) => (
                <li key={i}>
                  {e.createdAt ? new Date(e.createdAt).toLocaleString('ko-KR') : ''} · {koActor(e.actorKind)} · {koStatus(e.toStatus)}
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </AgencyCastingGate>
  )
}
