'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, type CSSProperties } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable'
import { superAdminApi, type CreditPolicyRow } from '@/lib/api/superAdmin'
import { LAYOUT } from '@/lib/design-tokens'

type Draft = { cost: number; active: boolean }

export default function SuperAdminCreditPoliciesPage() {
  const qc = useQueryClient()
  const { data: policies, isLoading, error } = useQuery({
    queryKey: ['superAdmin', 'credit-policies'],
    queryFn: () => superAdminApi.listCreditPolicies(),
  })

  const [drafts, setDrafts] = useState<Record<string, Draft>>({})

  useEffect(() => {
    if (!policies) return
    const next: Record<string, Draft> = {}
    for (const p of policies) {
      next[p.key] = { cost: p.cost, active: p.active }
    }
    setDrafts(next)
  }, [policies])

  const patchMutation = useMutation({
    mutationFn: ({ key, body }: { key: string; body: { cost?: number; active?: boolean } }) =>
      superAdminApi.patchCreditPolicy(key, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-policies'] })
    },
  })

  const inputStyle: CSSProperties = {
    height: 36,
    padding: '0 10px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    width: 100,
  }

  const columns: DataTableColumn<CreditPolicyRow>[] = [
    {
      id: 'key',
      header: 'key',
      cell: (row) => <code style={{ fontSize: 13 }}>{row.key}</code>,
    },
    {
      id: 'cost',
      header: 'cost',
      cell: (row) => (
        <input
          type="number"
          min={0}
          style={inputStyle}
          value={drafts[row.key]?.cost ?? row.cost}
          onChange={(e) =>
            setDrafts((d) => ({
              ...d,
              [row.key]: { ...d[row.key], cost: Number(e.target.value), active: d[row.key]?.active ?? row.active },
            }))
          }
        />
      ),
    },
    {
      id: 'active',
      header: 'active',
      cell: (row) => (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={drafts[row.key]?.active ?? row.active}
            onChange={(e) =>
              setDrafts((d) => ({
                ...d,
                [row.key]: { cost: d[row.key]?.cost ?? row.cost, active: e.target.checked },
              }))
            }
          />
          활성
        </label>
      ),
    },
    {
      id: 'save',
      header: '',
      width: '100px',
      cell: (row) => {
        const d = drafts[row.key]
        const changed =
          d && (d.cost !== row.cost || d.active !== row.active)
        return (
          <button
            type="button"
            disabled={!changed || patchMutation.isPending}
            onClick={() => {
              if (!d) return
              patchMutation.mutate({ key: row.key, body: { cost: d.cost, active: d.active } })
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: changed ? '#7c3aed' : '#e5e7eb',
              color: changed ? '#fff' : '#9ca3af',
              fontWeight: 600,
              fontSize: 13,
              cursor: changed ? 'pointer' : 'default',
            }}
          >
            저장
          </button>
        )
      },
    },
  ]

  return (
    <div style={{ padding: `0 ${LAYOUT.containerPaddingPx}px` }}>
      <AdminCard title="크레딧 정책">
        {isLoading && <p>불러오는 중…</p>}
        {error && <p style={{ color: '#b91c1c' }}>목록을 불러오지 못했습니다.</p>}
        {policies && (
          <DataTable columns={columns} rows={policies} getRowKey={(r) => r.key} />
        )}
        {patchMutation.isError && (
          <p style={{ color: '#b91c1c', marginTop: 12 }}>저장에 실패했습니다. 권한·입력값을 확인하세요.</p>
        )}
      </AdminCard>
    </div>
  )
}
