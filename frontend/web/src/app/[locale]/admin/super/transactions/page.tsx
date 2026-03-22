'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable'
import { superAdminApi, type CreditTransactionRow } from '@/lib/api/superAdmin'
import { LAYOUT } from '@/lib/design-tokens'

export default function SuperAdminTransactionsPage() {
  const [userId, setUserId] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  const toIso = (local: string, endOfDay: boolean) => {
    if (!local) return undefined
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return undefined
    if (endOfDay) {
      d.setHours(23, 59, 59, 999)
    }
    return d.toISOString()
  }

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superAdmin', 'credit-transactions', userId, type, from, to, page],
    queryFn: () =>
      superAdminApi.listCreditTransactions({
        userId: userId.trim() || undefined,
        type: type.trim() || undefined,
        from: toIso(from, false),
        to: to ? toIso(to, true) : undefined,
        page,
        size: 50,
      }),
  })

  const columns: DataTableColumn<CreditTransactionRow>[] = [
    {
      id: 'createdAt',
      header: 'created_at',
      cell: (r) => new Date(r.createdAt).toLocaleString('ko-KR'),
    },
    { id: 'userId', header: 'user_id', cell: (r) => <code style={{ fontSize: 12 }}>{r.userId}</code> },
    { id: 'amount', header: 'amount', cell: (r) => r.amount },
    { id: 'before', header: 'before', cell: (r) => (r.beforeBalance != null ? r.beforeBalance : '—') },
    { id: 'after', header: 'after', cell: (r) => (r.afterBalance != null ? r.afterBalance : '—') },
    { id: 'type', header: 'type', cell: (r) => r.type },
    { id: 'reason', header: 'reason', cell: (r) => r.reason },
    {
      id: 'ref',
      header: 'reference_id',
      cell: (r) => r.referenceId ?? '—',
    },
    {
      id: 'grantedBy',
      header: 'granted_by',
      cell: (r) => (r.grantedBy ? <code style={{ fontSize: 11 }}>{r.grantedBy}</code> : '—'),
    },
    {
      id: 'note',
      header: 'note',
      cell: (r) => (r.note ? <span style={{ fontSize: 12 }}>{r.note}</span> : '—'),
    },
  ]

  const fieldStyle = { height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 } as const

  return (
    <div style={{ padding: `0 ${LAYOUT.containerPaddingPx}px` }}>
      <AdminCard title="거래 내역 필터">
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            alignItems: 'end',
            marginBottom: 16,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            user_id
            <input style={fieldStyle} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            type
            <input style={fieldStyle} value={type} onChange={(e) => setType(e.target.value)} placeholder="CHARGE, USE, GRANT…" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            기간 시작
            <input type="datetime-local" style={fieldStyle} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            기간 끝
            <input type="datetime-local" style={fieldStyle} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <button
          type="button"
          onClick={() => {
            setPage(0)
            void refetch()
          }}
          disabled={isFetching}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: '#7c3aed',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          조회
        </button>
      </AdminCard>

      <AdminCard title="거래 목록">
        {isLoading && <p>불러오는 중…</p>}
        {error && <p style={{ color: '#b91c1c' }}>목록을 불러오지 못했습니다.</p>}
        {data && (
          <>
            <DataTable columns={columns} rows={data.content} getRowKey={(r) => r.id} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                총 {data.totalElements}건 · 페이지 {data.number + 1} / {Math.max(1, data.totalPages)}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={page <= 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  이전
                </button>
                <button
                  type="button"
                  disabled={data.totalPages <= page + 1 || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  )
}
