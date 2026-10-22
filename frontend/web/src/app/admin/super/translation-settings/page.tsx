'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { superAdminApi } from '@/shared/api/superAdmin'

function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message
  }
  return '요청 실패'
}

export default function TranslationSettingsPage() {
  const qc = useQueryClient()
  const settings = useQuery({
    queryKey: ['superAdmin', 'translation-settings'],
    queryFn: () => superAdminApi.getTranslationSettings(),
  })
  const [endpointUrl, setEndpointUrl] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!settings.data) return
    setEndpointUrl(settings.data.endpointUrl ?? '')
    setModel(settings.data.model ?? '')
  }, [settings.data])

  const save = useMutation({
    mutationFn: () =>
      superAdminApi.patchTranslationSettings({
        endpointUrl,
        model,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined,
      }),
    onSuccess: async () => {
      setApiKey('')
      setError(null)
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'translation-settings'] })
    },
    onError: (err) => setError(errorMessage(err)),
  })

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-xl font-semibold">번역 공급자</h1>
      <p className="mb-4 text-sm text-gray-600">
        키는 서버에만 암호화해 저장합니다. 비어 있는 키 입력은 기존 암호문을 유지합니다. 설정이 없으면 자동 번역은
        NOT_CONFIGURED 이며 가짜 번역문을 만들지 않습니다.
      </p>
      <p className="mb-4 text-sm">상태: {settings.data?.state ?? '-'}</p>
      <label className="mb-3 block text-sm">
        엔드포인트 (https)
        <input className="mt-1 w-full rounded border px-3 py-2" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
      </label>
      <label className="mb-3 block text-sm">
        모델
        <input className="mt-1 w-full rounded border px-3 py-2" value={model} onChange={(e) => setModel(e.target.value)} />
      </label>
      <label className="mb-3 block text-sm">
        API 키 {settings.data?.apiKeyConfigured ? '(저장됨, 다시 입력하면 교체)' : '(없음)'}
        <input
          type="password"
          autoComplete="off"
          className="mt-1 w-full rounded border px-3 py-2"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </label>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        저장
      </button>
    </div>
  )
}
