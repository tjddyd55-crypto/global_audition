'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n.config'
import { agencyCastingApi } from '@/shared/api/casting'
import { OFFER_STATUSES } from '@/shared/casting/model'
import { AgencyCastingGate } from '@/components/casting/AgencyGate'
import { koStatus } from '@/components/casting/agencyKo'

export default function AgencyCastingListPage() {
  const sp = useSearchParams()
  const talentId = sp?.get('talentId') ?? undefined
  const [status, setStatus] = useState('')
  const offers = useQuery({ queryKey: ['agency', 'offers', status, talentId], queryFn: () => agencyCastingApi.offers(status || undefined, talentId) })
  return (
    <AgencyCastingGate requireApproval={false} title="캐스팅 제안">
      <p className="text-sm text-neutral-600">
        보낸 제안과 응답 상태입니다. 수락은 지원자의 관심 표시이며 계약·지원·결제가 아닙니다. 새 제안은 인재 검색이나 지원자 채널에서 보냅니다.
      </p>
      <div className="flex flex-wrap gap-1.5 text-sm">
        {['', ...OFFER_STATUSES].map((s) => (
          <button key={s || 'ALL'} type="button" className={`rounded-full px-3 py-1 ${status === s ? 'bg-neutral-900 text-white' : 'border'}`} onClick={() => setStatus(s)}>
            {s ? koStatus(s) : '전체'}
          </button>
        ))}
        {talentId ? (
          <Link href="/my/casting" className="rounded-full border border-violet-300 px-3 py-1 text-violet-700 no-underline">
            지원자 필터 해제
          </Link>
        ) : null}
        <Link href="/my/talents" className="ml-auto rounded-full bg-violet-600 px-3 py-1 font-semibold text-white no-underline">
          인재 검색
        </Link>
      </div>
      {offers.isLoading ? <p className="text-sm text-neutral-600">불러오는 중…</p> : null}
      {offers.data && offers.data.length === 0 ? <p className="text-sm text-neutral-600">보낸 제안이 없습니다.</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs text-neutral-500">
            <tr>
              <th className="py-2">제목</th>
              <th>지원자</th>
              <th>상태</th>
              <th>보낸 날</th>
              <th>응답 기한</th>
            </tr>
          </thead>
          <tbody>
            {(offers.data ?? []).map((o) => (
              <tr key={o.id} className="border-t border-neutral-200" data-testid="agency-offer-row">
                <td className="py-2">
                  <Link href={`/my/casting/${o.id}`} className="font-medium text-violet-700 underline">
                    {o.title}
                  </Link>
                </td>
                <td>{o.talent?.name ?? '—'}</td>
                <td>{koStatus(o.status)}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('ko-KR') : ''}</td>
                <td>{o.expiresAt ? new Date(o.expiresAt).toLocaleDateString('ko-KR') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AgencyCastingGate>
  )
}
