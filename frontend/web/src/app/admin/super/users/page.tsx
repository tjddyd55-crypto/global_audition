'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  CREDIT_GRANT_REASONS,
  MAX_CREDIT_GRANT_AMOUNT,
  superAdminApi,
  type CreditGrantReason,
  type UserCreditLookup,
} from '@/lib/api/superAdmin'

function grantErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined
    return d?.message ?? err.message ?? '지급 실패'
  }
  return '지급 실패'
}

function formatJoinedAt(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ko-KR')
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const [amount, setAmount] = useState<number>(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedNickname, setSelectedNickname] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [grantReason, setGrantReason] = useState<CreditGrantReason>('ADMIN_GRANT')
  const [grantError, setGrantError] = useState<string | null>(null)

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['superAdmin', 'admin-users', q, page, pageSize],
    queryFn: () => superAdminApi.listUsersWithCredits({ q: q || undefined, page, size: pageSize }),
  })

  const users: UserCreditLookup[] = data?.content ?? []

  const grantMut = useMutation({
    mutationFn: () =>
      superAdminApi.grantCredits({
        userId: selectedUserId!,
        amount: Math.min(MAX_CREDIT_GRANT_AMOUNT, Math.max(1, Math.floor(amount))),
        reason: grantReason,
      }),
    onSuccess: () => {
      setGrantError(null)
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'admin-users'] })
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-transactions'] })
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'admin-logs'] })
      setSelectedUserId(null)
      setSelectedNickname(null)
      setSelectedEmail(null)
      setAmount(1)
      alert('지급이 반영되었습니다.')
    },
    onError: (err) => {
      setGrantError(grantErrorMessage(err))
    },
  })

  const onGrant = () => {
    setGrantError(null)
    if (!selectedUserId) {
      setGrantError('테이블에서 유저를 선택하세요.')
      return
    }
    const a = Math.min(MAX_CREDIT_GRANT_AMOUNT, Math.max(1, Math.floor(amount)))
    if (a !== amount) setAmount(a)
    if (!confirm(`선택한 유저에게 ${a} 크레딧을 지급할까요?\n사유: ${grantReason}`)) return
    grantMut.mutate()
  }

  const applySearch = () => {
    setPage(0)
    setQ(searchInput.trim())
  }

  const selectUser = (u: UserCreditLookup) => {
    setSelectedUserId(u.userId)
    setSelectedNickname(u.nickname)
    setSelectedEmail(u.email)
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">유저 관리</h1>

      <div className="mb-4 rounded-lg border bg-white p-4">
        <p className="mb-3 text-xs text-gray-500">
          API: GET <code className="rounded bg-gray-100 px-1">/api/admin/users</code> · POST{' '}
          <code className="rounded bg-gray-100 px-1">/api/admin/credits/grant</code> · 검색: 이메일·닉네임 부분 일치
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-2 border-b border-gray-100 pb-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">닉네임 / 이메일 / 실명 검색</span>
            <input
              className="w-72 rounded border border-gray-300 px-2 py-1.5"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="nickname · email · 실명 일부"
            />
          </label>
          <button
            type="button"
            onClick={applySearch}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-900"
          >
            검색
          </button>
        </div>

        <p className="mb-2 text-sm font-medium text-gray-800">크레딧 지급</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value as CreditGrantReason)}
          >
            {CREDIT_GRANT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={MAX_CREDIT_GRANT_AMOUNT}
            className="w-28 rounded border border-gray-300 px-2 py-1.5"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="지급액"
          />
          <button
            type="button"
            onClick={onGrant}
            disabled={grantMut.isPending || !selectedUserId}
            className="rounded bg-[#3B82F6] px-3 py-1.5 text-sm text-white disabled:bg-gray-300"
          >
            지급
          </button>
          {selectedUserId && (
            <span className="text-xs text-gray-500">
              선택됨: <span className="font-medium text-gray-800">{selectedNickname}</span> ·{' '}
              <span className="text-gray-700">{selectedEmail}</span>
            </span>
          )}
        </div>
        {grantError && <p className="mt-2 text-sm text-red-700">{grantError}</p>}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        {isLoading && <p className="p-4 text-sm text-gray-600">불러오는 중…</p>}
        {error && (
          <p className="p-4 text-sm text-red-700">
            유저 목록을 불러오지 못했습니다. SUPER_ADMIN·토큰·CORS(credentials)를 확인하세요.
          </p>
        )}

        {!isLoading && !error && users.length > 0 && (
          <>
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="py-2 pl-4 pr-2 font-medium">닉네임</th>
                  <th className="py-2 pr-2 font-medium">실명</th>
                  <th className="py-2 pr-2 font-medium">Email</th>
                  <th className="py-2 pr-2 font-medium">상태</th>
                  <th className="py-2 pr-2 font-medium">가입일</th>
                  <th className="py-2 pr-2 font-medium">Balance</th>
                  <th className="py-2 pr-4 font-medium">선택</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b border-gray-100">
                    <td className="py-2 pl-4 pr-2 font-medium text-gray-900">{u.nickname}</td>
                    <td className="py-2 pr-2 text-gray-800">{u.name?.trim() ? u.name : '—'}</td>
                    <td className="py-2 pr-2">{u.email}</td>
                    <td className="py-2 pr-2 text-gray-700">{u.accountStatus ?? '—'}</td>
                    <td className="py-2 pr-2 whitespace-nowrap text-gray-600">{formatJoinedAt(u.createdAt)}</td>
                    <td className="py-2 pr-2 font-medium">{u.balance}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => selectUser(u)}
                        className={`rounded px-2 py-1 text-xs ${
                          selectedUserId === u.userId
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        선택
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
              <span>
                총 {data?.totalElements ?? 0}명 · 페이지 {(data?.number ?? 0) + 1} / {Math.max(1, data?.totalPages ?? 1)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 0 || isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
                >
                  이전
                </button>
                <button
                  type="button"
                  disabled={(data?.totalPages ?? 1) <= page + 1 || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}

        {!isLoading && !error && users.length === 0 && (
          <p className="p-4 text-sm text-gray-600">조건에 맞는 유저가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
