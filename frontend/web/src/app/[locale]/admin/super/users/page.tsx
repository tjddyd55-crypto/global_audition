'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import {
  CREDIT_GRANT_REASONS,
  MAX_CREDIT_GRANT_AMOUNT,
  superAdminApi,
  type CreditGrantReason,
  type UserCreditLookup,
} from '@/lib/api/superAdmin'
import { LAYOUT } from '@/lib/design-tokens'

export default function SuperAdminUserCreditsPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [lookup, setLookup] = useState<UserCreditLookup | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [deductAmount, setDeductAmount] = useState<number>(0)
  const [grantAmount, setGrantAmount] = useState<number>(1)
  const [grantReason, setGrantReason] = useState<CreditGrantReason>('ADMIN_GRANT')
  const [grantNote, setGrantNote] = useState('')
  const [deductNote, setDeductNote] = useState('')

  const lookupMut = useMutation({
    mutationFn: () => superAdminApi.lookupUser(q.trim()),
    onSuccess: (data) => {
      setLookup(data)
      setLookupError(null)
    },
    onError: () => {
      setLookup(null)
      setLookupError('사용자를 찾을 수 없거나 요청이 실패했습니다.')
    },
  })

  const grantMut = useMutation({
    mutationFn: () =>
      superAdminApi.grantCredits({
        userId: lookup!.userId,
        amount: grantAmount,
        reason: grantReason,
        note: grantNote.trim() || undefined,
      }),
    onSuccess: (res) => {
      setLookup((prev) => (prev ? { ...prev, balance: res.balanceAfter } : prev))
      qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-transactions'] })
      qc.invalidateQueries({ queryKey: ['superAdmin', 'admin-logs'] })
    },
  })

  const adjustMut = useMutation({
    mutationFn: () =>
      superAdminApi.adjustCredits({
        userId: lookup?.userId,
        amount: deductAmount,
        note: deductNote.trim() || undefined,
      }),
    onSuccess: (res) => {
      setLookup((prev) => (prev ? { ...prev, balance: res.balanceAfter } : prev))
      qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-transactions'] })
      qc.invalidateQueries({ queryKey: ['superAdmin', 'admin-logs'] })
      setDeductAmount(0)
    },
  })

  const fieldStyle = { height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, width: '100%', maxWidth: 400 } as const

  const clampGrant = (n: number) => Math.min(MAX_CREDIT_GRANT_AMOUNT, Math.max(1, Math.floor(n)))

  const onGrantClick = () => {
    const a = clampGrant(grantAmount)
    if (a !== grantAmount) setGrantAmount(a)
    if (
      !confirm(
        `${lookup?.email ?? lookup?.userId} 님에게 ${a} 크레딧을 지급할까요?\n사유: ${grantReason}\n(type: GRANT)`
      )
    ) {
      return
    }
    grantMut.mutate()
  }

  const onDeductClick = () => {
    if (deductAmount >= 0) {
      alert('차감은 음수 금액으로 입력하세요.')
      return
    }
    if (!confirm(`${Math.abs(deductAmount)} 크레딧을 차감할까요?`)) return
    adjustMut.mutate()
  }

  return (
    <div style={{ padding: `0 ${LAYOUT.containerPaddingPx}px` }}>
      <AdminCard title="유저 검색">
        <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>이메일 또는 사용자 UUID로 검색합니다.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={fieldStyle}
            placeholder="email 또는 user id"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            disabled={!q.trim() || lookupMut.isPending}
            onClick={() => lookupMut.mutate()}
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
        </div>
        {lookupError && <p style={{ color: '#b91c1c', marginTop: 12 }}>{lookupError}</p>}
      </AdminCard>

      {lookup && (
        <>
          <AdminCard title="크레딧 선물 (+ 지급, GRANT)">
            <dl style={{ fontSize: 14, marginBottom: 16 }}>
              <dt style={{ color: '#888' }}>userId</dt>
              <dd style={{ margin: '4px 0 12px', wordBreak: 'break-all' }}>{lookup.userId}</dd>
              <dt style={{ color: '#888' }}>email</dt>
              <dd style={{ margin: '4px 0 12px' }}>{lookup.email}</dd>
              <dt style={{ color: '#888' }}>현재 balance</dt>
              <dd style={{ margin: '4px 0 12px', fontWeight: 700 }}>{lookup.balance}</dd>
            </dl>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              지급액 1 ~ {MAX_CREDIT_GRANT_AMOUNT} · 거래 타입 <strong>GRANT</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                사유
                <select
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value as CreditGrantReason)}
                  style={{ ...fieldStyle, maxWidth: 220 }}
                >
                  {CREDIT_GRANT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <input
                type="number"
                min={1}
                max={MAX_CREDIT_GRANT_AMOUNT}
                style={{ ...fieldStyle, maxWidth: 120 }}
                value={grantAmount}
                onChange={(e) => setGrantAmount(Number(e.target.value))}
              />
              <button
                type="button"
                disabled={grantMut.isPending || grantAmount < 1 || grantAmount > MAX_CREDIT_GRANT_AMOUNT}
                onClick={onGrantClick}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#059669',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                선물 지급
              </button>
            </div>
            <label style={{ display: 'block', fontSize: 14, marginTop: 12, maxWidth: 520 }}>
              <span style={{ color: '#666', display: 'block', marginBottom: 6 }}>메모 (선택 · 거래·관리 로그에 기록)</span>
              <textarea
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                rows={2}
                style={{
                  ...fieldStyle,
                  height: 'auto',
                  minHeight: 56,
                  padding: '8px 12px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                placeholder="예: 이벤트 보상, CS 처리 사유"
              />
            </label>
            {grantMut.isError && (
              <p style={{ color: '#b91c1c', marginTop: 12 }}>지급 실패 (한도·권한·검증을 확인하세요)</p>
            )}
          </AdminCard>

          <AdminCard title="크레딧 차감 (조정 API, 음수)">
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              차감만 이 경로를 사용합니다. 금액에 <strong>음수</strong>를 입력하세요. (POST /api/admin/credits/adjust)
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="number"
                style={{ ...fieldStyle, maxWidth: 160 }}
                value={deductAmount === 0 ? '' : deductAmount}
                placeholder="-10"
                onChange={(e) => setDeductAmount(e.target.value === '' ? 0 : Number(e.target.value))}
              />
              <button
                type="button"
                disabled={deductAmount >= 0 || adjustMut.isPending}
                onClick={onDeductClick}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: deductAmount >= 0 ? '#e5e7eb' : '#b91c1c',
                  color: '#fff',
                  fontWeight: 600,
                }}
              >
                차감 적용
              </button>
            </div>
            <label style={{ display: 'block', fontSize: 14, marginTop: 12, maxWidth: 520 }}>
              <span style={{ color: '#666', display: 'block', marginBottom: 6 }}>메모 (선택 · 거래·관리 로그에 기록)</span>
              <textarea
                value={deductNote}
                onChange={(e) => setDeductNote(e.target.value)}
                rows={2}
                style={{
                  ...fieldStyle,
                  height: 'auto',
                  minHeight: 56,
                  padding: '8px 12px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                placeholder="예: 오지급 회수, 정책 위반 조정"
              />
            </label>
            {adjustMut.isError && (
              <p style={{ color: '#b91c1c', marginTop: 12 }}>차감 실패 (잔액 부족 등)</p>
            )}
          </AdminCard>
        </>
      )}
    </div>
  )
}
