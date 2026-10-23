'use client'

import { useQuery } from '@tanstack/react-query'
import { superAdminApi } from '@/shared/api/superAdmin'
import { adminError, envLabel } from '../desk'

export default function PaymentWebhooksPage() {
  const webhooks = useQuery({
    queryKey: ['superAdmin', 'payment-webhooks'],
    queryFn: () => superAdminApi.listPaymentWebhooks(),
  })
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">웹훅 관리</h1>
      <p className="text-sm text-gray-600">수신 본문과 인증 정보는 저장하지 않고 화면에 표시하지 않습니다. 저장값은 해시와 처리 결과입니다.</p>
      {webhooks.isLoading && <p>불러오는 중…</p>}
      {webhooks.error && <p className="text-sm text-red-700">{adminError(webhooks.error)}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              {['Provider', '수신일시', '이벤트 유형', '검증', '처리', '중복', '실패 사유', '재처리'].map((label) => (
                <th key={label} className="py-2 pr-3">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(webhooks.data ?? []).map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 pr-3">{row.providerId}</td>
                <td className="py-2 pr-3">{row.createdAt}</td>
                <td className="py-2 pr-3">{row.eventType || row.status} · {envLabel(row.environment)}{row.orderNo ? ` · ${row.orderNo}` : ''}</td>
                <td className="py-2 pr-3">{row.signatureValid ? '유효' : '실패'}</td>
                <td className="py-2 pr-3">{row.status}</td>
                <td className="py-2 pr-3">{row.duplicate ? '중복' : '신규'}</td>
                <td className="py-2 pr-3">{row.failureReason || '—'}</td>
                <td className="py-2 pr-3">{row.reprocessStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
