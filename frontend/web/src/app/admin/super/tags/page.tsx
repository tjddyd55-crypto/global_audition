'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { superAdminTagApi, type TagRow } from '@/shared/api/tags'

function errMsg(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string } | undefined
    return d?.message ?? err.message ?? '요청 실패'
  }
  return '요청 실패'
}

export default function AdminTagsPage() {
  const qc = useQueryClient()
  const { data: rows, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superAdmin', 'tags'],
    queryFn: () => superAdminTagApi.list(),
  })

  const [name, setName] = useState('')
  const [type, setType] = useState<'SYSTEM' | 'USER'>('USER')
  const [formError, setFormError] = useState<string | null>(null)

  const createMut = useMutation({
    mutationFn: () => superAdminTagApi.create({ name: name.trim(), type }),
    onSuccess: () => {
      setFormError(null)
      setName('')
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'tags'] })
      void qc.invalidateQueries({ queryKey: ['tag-catalog'] })
    },
    onError: (e) => setFormError(errMsg(e)),
  })

  const patchMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ name: string; active: boolean }> }) =>
      superAdminTagApi.patch(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'tags'] })
      void qc.invalidateQueries({ queryKey: ['tag-catalog'] })
    },
  })

  const delMut = useMutation({
    mutationFn: (id: string) => superAdminTagApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['superAdmin', 'tags'] })
      void qc.invalidateQueries({ queryKey: ['tag-catalog'] })
    },
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">오디션 태그 관리</h1>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-800">태그 추가 (USER 권장 — SYSTEM은 시드·고정용)</h2>
        <p className="mb-3 text-xs text-gray-500">
          API: GET/POST/PATCH/DELETE <code className="rounded bg-gray-100 px-1">/api/admin/tags</code> · SUPER_ADMIN
        </p>
        {formError && <p className="mb-2 text-sm text-red-600">{formError}</p>}
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-600">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-0.5 rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="예: 인디"
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600">유형</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'SYSTEM' | 'USER')}
              className="mt-0.5 rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="USER">USER</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
          <button
            type="button"
            disabled={createMut.isPending || !name.trim()}
            onClick={() => createMut.mutate()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            등록
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        {isLoading && <p className="text-sm text-gray-600">불러오는 중…</p>}
        {error && (
          <p className="text-sm text-red-700">목록을 불러오지 못했습니다. SUPER_ADMIN 권한을 확인하세요.</p>
        )}
        {rows && rows.length === 0 && <p className="text-sm text-gray-600">태그가 없습니다.</p>}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="py-2 pr-4">이름</th>
                  <th className="py-2 pr-4">유형</th>
                  <th className="py-2 pr-4">활성</th>
                  <th className="py-2">동작</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: TagRow) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-2 pr-4">{r.type}</td>
                    <td className="py-2 pr-4">{r.active ? '예' : '아니오'}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          disabled={patchMut.isPending}
                          onClick={() => {
                            const next = window.prompt('새 이름', r.name)
                            if (next == null || !next.trim()) return
                            patchMut.mutate({ id: r.id, body: { name: next.trim() } })
                          }}
                        >
                          이름 수정
                        </button>
                        <button
                          type="button"
                          className="text-xs text-amber-600 hover:underline"
                          disabled={patchMut.isPending}
                          onClick={() => patchMut.mutate({ id: r.id, body: { active: !r.active } })}
                        >
                          {r.active ? '비활성화' : '활성화'}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          disabled={delMut.isPending}
                          onClick={() => {
                            if (!confirm('비활성화(소프트)할까요? 참조 중이면 물리 삭제는 불가합니다.')) return
                            delMut.mutate(r.id)
                          }}
                        >
                          끄기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
