'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable'
import { superAdminApi, type CreditPackageRow } from '@/lib/api/superAdmin'
import { LAYOUT } from '@/lib/design-tokens'
import { formatNumericInput, formatUsdInput, parseNonNegativeInt, parseUsdDecimal } from '@/lib/utils/numberFormat'
import { formatCurrency } from '@/lib/money/currency'
import { formatCreditsCount } from '@/lib/money/creditsDisplay'

type FormState = {
  name: string
  price: string
  credits: string
  bonusCredits: string
  active: boolean
  sortOrder: string
}

const emptyForm: FormState = {
  name: '',
  price: '',
  credits: '0',
  bonusCredits: '0',
  active: true,
  sortOrder: '0',
}

function rowToForm(p: CreditPackageRow): FormState {
  return {
    name: p.name,
    price: formatUsdInput(String(p.price)),
    credits: formatNumericInput(String(p.credits)),
    bonusCredits: formatNumericInput(String(p.bonusCredits)),
    active: p.active,
    sortOrder: formatNumericInput(String(p.sortOrder ?? 0)),
  }
}

function formToPayload(f: FormState) {
  return {
    name: f.name,
    price: parseUsdDecimal(f.price, 0),
    credits: parseNonNegativeInt(f.credits, 0),
    bonusCredits: parseNonNegativeInt(f.bonusCredits, 0),
    active: f.active,
    sortOrder: parseNonNegativeInt(f.sortOrder, 0),
  }
}

export default function SuperAdminCreditPackagesPage() {
  const qc = useQueryClient()
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['superAdmin', 'credit-packages'],
    queryFn: () => superAdminApi.listCreditPackages(),
  })

  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)

  const createMut = useMutation({
    mutationFn: () => superAdminApi.createCreditPackage(formToPayload(createForm)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-packages'] })
      setCreateForm(emptyForm)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormState }) =>
      superAdminApi.updateCreditPackage(id, formToPayload(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-packages'] })
      setEditingId(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => superAdminApi.deleteCreditPackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-packages'] }),
  })

  const startEdit = (p: CreditPackageRow) => {
    setEditingId(p.id)
    setEditForm(rowToForm(p))
  }

  const fieldStyle = { height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 } as const

  const columns: DataTableColumn<CreditPackageRow>[] = [
    {
      id: 'sort',
      header: 'sort_order',
      cell: (r) => formatCreditsCount(r.sortOrder ?? 0),
    },
    { id: 'name', header: 'name', cell: (r) => r.name },
    {
      id: 'price',
      header: 'price',
      cell: (r) => formatCurrency(Number(r.price)),
    },
    {
      id: 'credits',
      header: 'credits',
      cell: (r) => `${formatCreditsCount(Number(r.credits))} 크레딧`,
    },
    {
      id: 'bonus',
      header: 'bonus_credits',
      cell: (r) => `${formatCreditsCount(Number(r.bonusCredits))} 크레딧`,
    },
    {
      id: 'active',
      header: 'active',
      cell: (r) => (r.active ? '예' : '아니오'),
    },
    {
      id: 'actions',
      header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => startEdit(r)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #c4b5fd', background: '#faf5ff', fontSize: 13 }}
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('이 패키지를 삭제할까요?')) deleteMut.mutate(r.id)
            }}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 13 }}
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ padding: `0 ${LAYOUT.containerPaddingPx}px` }}>
      <AdminCard title="크레딧 패키지">
        {isLoading && <p>불러오는 중…</p>}
        {error && <p style={{ color: '#b91c1c' }}>목록을 불러오지 못했습니다.</p>}
        {packages && <DataTable columns={columns} rows={packages} getRowKey={(r) => r.id} />}
      </AdminCard>

      <AdminCard title="패키지 추가">
        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            name
            <input
              style={fieldStyle}
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            price (USD)
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                style={{ ...fieldStyle, flex: 1 }}
                value={createForm.price}
                onChange={(e) => setCreateForm((f) => ({ ...f, price: formatUsdInput(e.target.value) }))}
              />
              <span style={{ fontSize: 14, color: '#555' }}>$</span>
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            credits
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                style={{ ...fieldStyle, flex: 1 }}
                value={createForm.credits}
                onChange={(e) => setCreateForm((f) => ({ ...f, credits: formatNumericInput(e.target.value) }))}
              />
              <span style={{ fontSize: 14, color: '#555' }}>크레딧</span>
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            bonus_credits
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                style={{ ...fieldStyle, flex: 1 }}
                value={createForm.bonusCredits}
                onChange={(e) => setCreateForm((f) => ({ ...f, bonusCredits: formatNumericInput(e.target.value) }))}
              />
              <span style={{ fontSize: 14, color: '#555' }}>크레딧</span>
            </div>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            sort_order
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              style={fieldStyle}
              value={createForm.sortOrder}
              onChange={(e) => setCreateForm((f) => ({ ...f, sortOrder: formatNumericInput(e.target.value) }))}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={createForm.active}
              onChange={(e) => setCreateForm((f) => ({ ...f, active: e.target.checked }))}
            />
            active
          </label>
          <button
            type="button"
            disabled={!createForm.name.trim() || parseUsdDecimal(createForm.price, 0) < 0.01 || createMut.isPending}
            onClick={() => createMut.mutate()}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontWeight: 600,
              alignSelf: 'flex-start',
            }}
          >
            추가
          </button>
        </div>
        {createMut.isError && <p style={{ color: '#b91c1c', marginTop: 12 }}>추가 실패</p>}
      </AdminCard>

      {editingId && (
        <AdminCard title="패키지 수정">
          <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              name
              <input
                type="text"
                style={fieldStyle}
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              price (USD)
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  style={{ ...fieldStyle, flex: 1 }}
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: formatUsdInput(e.target.value) }))}
                />
                <span style={{ fontSize: 14, color: '#555' }}>$</span>
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              credits
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  style={{ ...fieldStyle, flex: 1 }}
                  value={editForm.credits}
                  onChange={(e) => setEditForm((f) => ({ ...f, credits: formatNumericInput(e.target.value) }))}
                />
                <span style={{ fontSize: 14, color: '#555' }}>크레딧</span>
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              bonus_credits
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  style={{ ...fieldStyle, flex: 1 }}
                  value={editForm.bonusCredits}
                  onChange={(e) => setEditForm((f) => ({ ...f, bonusCredits: formatNumericInput(e.target.value) }))}
                />
                <span style={{ fontSize: 14, color: '#555' }}>크레딧</span>
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
              sort_order
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                style={fieldStyle}
                value={editForm.sortOrder}
                onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: formatNumericInput(e.target.value) }))}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
              />
              active
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => updateMut.mutate({ id: editingId, body: editForm })}
                disabled={updateMut.isPending}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#7c3aed',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                저장
              </button>
              <button type="button" onClick={() => setEditingId(null)} style={{ padding: '10px 18px', borderRadius: 8 }}>
                취소
              </button>
            </div>
          </div>
          {updateMut.isError && <p style={{ color: '#b91c1c', marginTop: 12 }}>저장 실패</p>}
        </AdminCard>
      )}
    </div>
  )
}
