'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable'
import { superAdminApi, type AdminLogEntry } from '@/lib/api/superAdmin'
import { LAYOUT } from '@/lib/design-tokens'

const ACTIONS = [
  '',
  'CREDIT_GRANT',
  'CREDIT_GRANT_BULK',
  'CREDIT_ADJUST',
  'CREDIT_POLICY_PATCH',
  'USER_UPDATE',
] as const

export default function SuperAdminLogsPage() {
  const [adminId, setAdminId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toIsoStart = (local: string) => {
    if (!local) return undefined
    const d = new Date(local)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }

  const toIsoEnd = (local: string) => {
    if (!local) return undefined
    const d = new Date(local)
    if (Number.isNaN(d.getTime())) return undefined
    d.setHours(23, 59, 59, 999)
    return d.toISOString()
  }

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['superAdmin', 'admin-logs', adminId, action, from, to, page],
    queryFn: () =>
      superAdminApi.listAdminLogs({
        adminId: adminId.trim() || undefined,
        action: action.trim() || undefined,
        from: toIsoStart(from),
        to: to ? toIsoEnd(to) : undefined,
        page,
        size: 50,
      }),
  })

  const fieldStyle = { height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 } as const

  const columns: DataTableColumn<AdminLogEntry>[] = [
    {
      id: 'time',
      header: '시간',
      cell: (r) => new Date(r.createdAt).toLocaleString('ko-KR'),
    },
    { id: 'action', header: 'action', cell: (r) => <code style={{ fontSize: 12 }}>{r.action}</code> },
    { id: 'admin', header: 'admin_id', cell: (r) => <code style={{ fontSize: 11 }}>{r.adminId}</code> },
    { id: 'target', header: 'target', cell: (r) => `${r.targetType}${r.targetId ? ` / ${r.targetId}` : ''}` },
    {
      id: 'payload',
      header: 'payload',
      cell: (r) => (
        <button
          type="button"
          onClick={() => setExpandedId((id) => (id === r.id ? null : r.id))}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #c4b5fd',
            background: expandedId === r.id ? '#ede9fe' : '#fff',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {expandedId === r.id ? '접기' : 'JSON 보기'}
        </button>
      ),
    },
  ]

  return (
    <div style={{ padding: `0 ${LAYOUT.containerPaddingPx}px` }}>
      <AdminCard title="필터">
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            alignItems: 'end',
            marginBottom: 12,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            admin_id
            <input style={fieldStyle} value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="UUID" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            action
            <select style={fieldStyle} value={action} onChange={(e) => setAction(e.target.value)}>
              {ACTIONS.map((a) => (
                <option key={a || 'all'} value={a}>
                  {a || '(전체)'}
                </option>
              ))}
            </select>
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
          onClick={() => setPage(0)}
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

      <AdminCard title="관리자 로그">
        {isLoading && <p>불러오는 중…</p>}
        {error && <p style={{ color: '#b91c1c' }}>목록을 불러오지 못했습니다.</p>}
        {data && (
          <>
            <DataTable columns={columns} rows={data.content} getRowKey={(r) => r.id} />
            {expandedId ? (
              (() => {
                const row = data.content.find((r) => r.id === expandedId)
                if (!row) return null
                return (
                  <pre
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 8,
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 360,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {JSON.stringify(row.payload, null, 2)}
                  </pre>
                )
              })()
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                총 {data.totalElements}건 · {data.number + 1} / {Math.max(1, data.totalPages)}
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
