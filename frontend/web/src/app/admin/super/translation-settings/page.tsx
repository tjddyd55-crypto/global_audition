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
  const usage = useQuery({
    queryKey: ['superAdmin', 'translation-usage'],
    queryFn: () => superAdminApi.translationUsage(),
  })
  const [activeProvider, setActiveProvider] = useState('GOOGLE_CLOUD_TRANSLATION')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [googleProjectId, setGoogleProjectId] = useState('')
  const [googleLocation, setGoogleLocation] = useState('global')
  const [googleModel, setGoogleModel] = useState('general/nmt')
  const [googleCredentials, setGoogleCredentials] = useState('')
  const [googleCost, setGoogleCost] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [probe, setProbe] = useState<string | null>(null)

  useEffect(() => {
    if (!settings.data) return
    setActiveProvider(settings.data.activeProvider ?? 'GOOGLE_CLOUD_TRANSLATION')
    setEndpointUrl(settings.data.endpointUrl ?? '')
    setModel(settings.data.model ?? '')
    setGoogleProjectId(settings.data.googleProjectId ?? '')
    setGoogleLocation(settings.data.googleLocation ?? 'global')
    setGoogleModel(settings.data.googleModel ?? 'general/nmt')
  }, [settings.data])

  const save = useMutation({
    mutationFn: () =>
      superAdminApi.patchTranslationSettings({
        activeProvider,
        endpointUrl,
        model,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined,
        googleProjectId,
        googleLocation,
        googleModel,
        googleCredentialsJson: googleCredentials.trim() ? googleCredentials.trim() : undefined,
        googleCostMicroUsdPerMillion: googleCost.trim() ? Number(googleCost) : undefined,
      }),
    onSuccess: async () => {
      setApiKey('')
      setGoogleCredentials('')
      setGoogleCost('')
      setError(null)
      await qc.invalidateQueries({ queryKey: ['superAdmin', 'translation-settings'] })
    },
    onError: (err) => setError(errorMessage(err)),
  })

  const connection = useMutation({
    mutationFn: () => superAdminApi.testGoogleTranslation(),
    onSuccess: (data) => {
      setProbe(
        data.calledProvider
          ? `연결 시험 ${data.state}${data.errorCode ? ` (${data.errorCode})` : ''}`
          : '자격 증명이 없어 공급자를 호출하지 않았습니다.',
      )
    },
    onError: (err) => setProbe(errorMessage(err)),
  })

  const languages = useMutation({
    mutationFn: () => superAdminApi.googleTranslationLanguages(),
    onSuccess: (data) => {
      if (!data.calledProvider) {
        setProbe('자격 증명이 없어 언어 목록을 조회하지 않았습니다.')
        return
      }
      setProbe(
        `언어 조회 ${data.state}. ko ${data.koreanSupported ? '지원' : '없음'}, en ${
          data.englishSupported ? '지원' : '없음'
        }, mn ${data.mongolianSupported ? '지원' : '없음'}.`,
      )
    },
    onError: (err) => setProbe(errorMessage(err)),
  })

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-xl font-semibold">번역 공급자</h1>
      <p className="mb-4 text-sm text-gray-600">
        기본 공급자는 Google Cloud Translation Advanced v3 입니다. 서비스 계정 JSON 은 서버에만 암호화해 저장하고
        응답에 다시 보내지 않습니다. 인증은 OAuth2 액세스 토큰이며 API 키가 아닙니다. 필요한 IAM 역할은
        roles/cloudtranslate.user 입니다. 프로젝트와 리전은 여기에 저장한 값을 쓰고, 모델이 비어 있으면 general/nmt 를
        호출합니다. OpenAI 호환 설정은 보조 공급자로 유지됩니다. 키가 없으면 실제 호출은 하지 않습니다.
      </p>
      <p className="mb-4 text-sm text-gray-600">
        문자 비용은 추정치입니다. 적용 단가 {settings.data?.effectiveGoogleMicroUsdPerMillion ?? '-'} micro-USD /
        1,000,000자. 공식 NMT 리스트 가격은 cloud.google.com/translate/pricing 이며, 월 500,000자 크레딧은 이 화면의
        합계에서 빼지 않습니다.
      </p>
      <p className="mb-4 text-sm">
        활성 상태: {settings.data?.state ?? '-'} / Google {settings.data?.googleState ?? '-'} / OpenAI{' '}
        {settings.data?.openAiState ?? '-'}
      </p>
      <label className="mb-3 block text-sm">
        활성 공급자
        <select
          className="mt-1 w-full rounded border px-3 py-2"
          value={activeProvider}
          onChange={(e) => setActiveProvider(e.target.value)}
        >
          <option value="GOOGLE_CLOUD_TRANSLATION">Google Cloud Translation</option>
          <option value="OPENAI_COMPATIBLE">OpenAI 호환</option>
        </select>
      </label>
      <h2 className="mb-2 mt-6 text-base font-semibold">Google</h2>
      <label className="mb-3 block text-sm">
        프로젝트 ID
        <input className="mt-1 w-full rounded border px-3 py-2" value={googleProjectId} onChange={(e) => setGoogleProjectId(e.target.value)} />
      </label>
      <label className="mb-3 block text-sm">
        리전
        <input className="mt-1 w-full rounded border px-3 py-2" value={googleLocation} onChange={(e) => setGoogleLocation(e.target.value)} />
      </label>
      <label className="mb-3 block text-sm">
        모델
        <input className="mt-1 w-full rounded border px-3 py-2" value={googleModel} onChange={(e) => setGoogleModel(e.target.value)} />
      </label>
      <label className="mb-3 block text-sm">
        서비스 계정 JSON {settings.data?.googleCredentialsConfigured ? '(저장됨, 다시 붙여 넣으면 교체)' : '(없음)'}
        <textarea
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
          rows={4}
          autoComplete="off"
          value={googleCredentials}
          onChange={(e) => setGoogleCredentials(e.target.value)}
        />
      </label>
      <label className="mb-3 block text-sm">
        문자 단가 재정의 (micro-USD / 백만 자, 비우면 유지)
        <input className="mt-1 w-full rounded border px-3 py-2" value={googleCost} onChange={(e) => setGoogleCost(e.target.value)} />
      </label>
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          disabled={connection.isPending}
          onClick={() => connection.mutate()}
        >
          연결 시험
        </button>
        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          disabled={languages.isPending}
          onClick={() => languages.mutate()}
        >
          지원 언어
        </button>
      </div>
      {probe ? <p className="mb-4 text-sm text-gray-700">{probe}</p> : null}
      <h2 className="mb-2 text-base font-semibold">OpenAI 호환</h2>
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
      <h2 className="mb-2 mt-6 text-base font-semibold">이번 달 시도</h2>
      <p className="mb-4 text-sm text-gray-600">
        {usage.data
          ? `${usage.data.month} 시도 ${usage.data.attempts}건, 청구 문자 ${usage.data.billedCharacters}, 추정 ${usage.data.estimatedCostMicroUsd} micro-USD`
          : '사용량 불러오는 중'}
      </p>
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
