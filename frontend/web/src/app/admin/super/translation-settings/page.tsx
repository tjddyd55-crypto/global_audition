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
        키는 서버에만 암호화해 저장합니다. 비어 있는 키 입력은 기존 암호문을 유지하고 응답에 키를 넣지 않습니다.
        엔드포인트는 https 여야 하며 서버 허용 목록(기본 api.openai.com)과 DNS 공개 IP 검사를 통과해야 합니다.
        통과하지 못하면 CONFIGURED 가 되지 않습니다. 모델은 여기에 저장한 값만 호출합니다. 후보 예시는 gpt-6-luna,
        엔드포인트 예시는 https://api.openai.com/v1/chat/completions 이며 서버가 이 값을 기본으로 넣지 않습니다.
        API 키가 없으면 실제 호출은 하지 않습니다.
      </p>
      <p className="mb-4 text-sm text-gray-600">
        호출 전 확인: 저장한 모델이 해당 키에서 사용 가능한지, Chat Completions 가 response_format json_object 를
        받는지, 본문이 choices[0].message.content 에 있는지. gpt-6-luna 는 reasoning 때문에 content 가 비면 구조
        검증이 실패로 기록됩니다. 이 어댑터는 reasoning_effort 를 보내지 않습니다. 구조적 완전성은 코드가 검증하고,
        번역 의미 품질은 자동으로 판정하지 않습니다.
      </p>
      <p className="mb-4 text-sm">상태: {settings.data?.state ?? '-'}</p>
      <label className="mb-3 block text-sm">
        엔드포인트 (https)
        <input className="mt-1 w-full rounded border px-3 py-2" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
      </label>
      <label className="mb-3 block text-sm">
        모델
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="저장된 모델만 사용"
        />
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
