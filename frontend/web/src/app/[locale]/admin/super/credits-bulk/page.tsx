'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import {
  CREDIT_GRANT_REASONS,
  MAX_CREDIT_GRANT_AMOUNT,
  superAdminApi,
  type CreditGrantReason,
} from '@/lib/api/superAdmin'
import { LAYOUT } from '@/lib/design-tokens'

export default function SuperAdminCreditsBulkPage() {
  const qc = useQueryClient()
  const [country, setCountry] = useState('')
  const [createdAfterLocal, setCreatedAfterLocal] = useState('')
  const [amount, setAmount] = useState(1)
  const [reason, setReason] = useState<CreditGrantReason>('ADMIN_GRANT')
  const [result, setResult] = useState<{ affectedUsers: number; totalCreditsGranted: number } | null>(null)

  const bulkMut = useMutation({
    mutationFn: () => {
      const condition: { country?: string; createdAfter?: string } = {}
      if (country.trim()) condition.country = country.trim()
      if (createdAfterLocal) {
        const d = new Date(createdAfterLocal)
        if (!Number.isNaN(d.getTime())) {
          condition.createdAfter = d.toISOString()
        }
      }
      return superAdminApi.grantCreditsBulk({
        condition,
        amount,
        reason,
      })
    },
    onSuccess: (data) => {
      setResult(data)
      qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-transactions'] })
    },
  })

  const fieldStyle = { height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, width: '100%', maxWidth: 400 } as const

  const run = () => {
    if (!country.trim() && !createdAfterLocal) {
      alert('국가 코드 또는 가입일(이후) 중 하나 이상을 입력하세요.')
      return
    }
    if (amount < 1 || amount > MAX_CREDIT_GRANT_AMOUNT) {
      alert(`지급액은 1 ~ ${MAX_CREDIT_GRANT_AMOUNT} 사이여야 합니다.`)
      return
    }
    if (
      !confirm(
        `대량 지급을 실행할까요?\n\n인당 ${amount} 크레딧 · 사유: ${reason}\n조건: country=${country.trim() || '(미지정)'} / createdAfter=${createdAfterLocal || '(미지정)'}\n\n실행 전 대상 인원은 서버에서 다시 검증됩니다.`
      )
    ) {
      return
    }
    setResult(null)
    bulkMut.mutate()
  }

  return (
    <div style={{ padding: `0 ${LAYOUT.containerPaddingPx}px` }}>
      <AdminCard title="대량 크레딧 지급 (GRANT)">
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          <strong>country</strong>와 <strong>createdAfter</strong>는 AND 조건입니다. 둘 중 하나만 넣어도 됩니다.
          국가 코드는 유저 프로필 <code>country_code</code>와 일치해야 합니다 (미설정 유저는 country만으로는 제외됩니다).
        </p>
        <div style={{ display: 'grid', gap: 14, maxWidth: 480 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            condition.country (예: KR)
            <input style={fieldStyle} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="선택" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            condition.createdAfter (로컬 시각)
            <input
              type="datetime-local"
              style={fieldStyle}
              value={createdAfterLocal}
              onChange={(e) => setCreatedAfterLocal(e.target.value)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            amount (1 ~ {MAX_CREDIT_GRANT_AMOUNT})
            <input
              type="number"
              min={1}
              max={MAX_CREDIT_GRANT_AMOUNT}
              style={fieldStyle}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
            reason
            <select
              style={fieldStyle}
              value={reason}
              onChange={(e) => setReason(e.target.value as CreditGrantReason)}
            >
              {CREDIT_GRANT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={bulkMut.isPending}
            onClick={run}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontWeight: 700,
              alignSelf: 'flex-start',
            }}
          >
            실행 (확인 후)
          </button>
        </div>
        {bulkMut.isError && (
          <p style={{ color: '#b91c1c', marginTop: 16 }}>실패: 대상 인원 초과·검증 오류 등을 확인하세요.</p>
        )}
        {result && (
          <p style={{ marginTop: 16, fontSize: 15, fontWeight: 600 }}>
            완료: {result.affectedUsers}명에게 지급 · 총 {result.totalCreditsGranted} 크레딧
          </p>
        )}
      </AdminCard>
    </div>
  )
}
