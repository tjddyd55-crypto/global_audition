'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { superAdminApi, type CreditPolicyRow } from '@/lib/api/superAdmin'

type Draft = { cost: number; active: boolean }

function policyErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined
    return d?.message ?? err.message ?? '요청 실패'
  }
  return '요청 실패'
}

export default function CreditPoliciesPage() {
  const qc = useQueryClient()
  const { data: policies, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superAdmin', 'credit-policies'],
    queryFn: () => superAdminApi.listCreditPolicies(),
  })

  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!policies) return
    const next: Record<string, Draft> = {}
    for (const p of policies) {
      next[p.key] = { cost: p.cost, active: p.active }
    }
    setDrafts(next)
  }, [policies])

  const patchMutation = useMutation({
    mutationFn: ({ key, body }: { key: string; body: { cost: number; active: boolean } }) =>
      superAdminApi.patchCreditPolicy(key, body),
    onSuccess: () => {
      setSaveError(null)
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'credit-policies'] })
    },
    onError: (err) => {
      setSaveError(policyErrorMessage(err))
    },
  })

  const updateRow = (row: CreditPolicyRow) => {
    const d = drafts[row.key]
    if (!d) return
    setSaveError(null)
    patchMutation.mutate({ key: row.key, body: { cost: d.cost, active: d.active } })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">크레딧 정책 관리</h1>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="mb-3 text-xs text-gray-500">
          API: GET/PATCH <code className="rounded bg-gray-100 px-1">/api/admin/credit-policies</code> · Bearer +{' '}
          <code className="rounded bg-gray-100 px-1">withCredentials</code> (axios 클라이언트 사용)
        </p>

        {isLoading && <p className="text-sm text-gray-600">불러오는 중…</p>}
        {error && (
          <p className="text-sm text-red-700">목록을 불러오지 못했습니다. 로그인·SUPER_ADMIN 권한을 확인하세요.</p>
        )}
        {saveError && <p className="mb-2 text-sm text-red-700">{saveError}</p>}

        {policies && policies.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2 font-medium">KEY</th>
                  <th className="py-2 pr-2 font-medium">비용</th>
                  <th className="py-2 pr-2 font-medium">활성</th>
                  <th className="py-2 font-medium">갱신일</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => {
                  const d = drafts[p.key]
                  const changed =
                    d !== undefined && (d.cost !== p.cost || d.active !== p.active)
                  return (
                    <tr key={p.key} className="border-b border-gray-100">
                      <td className="py-2 pr-2 font-mono text-xs">{p.key}</td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={0}
                          className="w-24 rounded border border-gray-300 px-2 py-1"
                          value={d?.cost ?? p.cost}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            setDrafts((prev) => ({
                              ...prev,
                              [p.key]: {
                                cost: Number.isFinite(v) ? v : prev[p.key]?.cost ?? p.cost,
                                active: prev[p.key]?.active ?? p.active,
                              },
                            }))
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={d?.active ?? p.active}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [p.key]: {
                                  cost: prev[p.key]?.cost ?? p.cost,
                                  active: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span className="text-gray-600">활성</span>
                        </label>
                      </td>
                      <td className="py-2 pr-2 text-xs text-gray-500">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleString('ko-KR') : '—'}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          disabled={!changed || patchMutation.isPending}
                          onClick={() => updateRow(p)}
                          className="rounded bg-[#3B82F6] px-3 py-1 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          저장
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {policies && policies.length === 0 && !isLoading && (
          <p className="text-sm text-gray-600">등록된 정책이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
