'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orgAdminApi, orgErrorMessage } from '@/shared/api/orgAdmin'

type ContractFilesProps = {
  contractId: string
  canUpload: boolean
}

export function ContractFiles({ contractId, canUpload }: ContractFilesProps) {
  const qc = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const documents = useQuery({
    queryKey: ['org', 'contract-documents', contractId],
    queryFn: () => orgAdminApi.contractDocuments(contractId),
    enabled: Boolean(contractId),
  })
  const rows = documents.data ?? []
  const current = rows[0]

  const upload = useMutation({
    mutationFn: (file: File) => orgAdminApi.uploadContractDocument(contractId, file),
    onSuccess: async () => {
      setError(null)
      setMessage('PDF를 저장했습니다. 전자서명은 없습니다.')
      await qc.invalidateQueries({ queryKey: ['org', 'contract-documents', contractId] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })

  async function openBytes(download: boolean) {
    setError(null)
    setMessage(null)
    try {
      const file = await orgAdminApi.downloadContractDocument(contractId)
      const url = URL.createObjectURL(file.blob)
      if (download) {
        const link = document.createElement('a')
        link.href = url
        link.download = file.filename
        link.click()
      } else {
        window.open(url, '_blank', 'noopener')
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(orgErrorMessage(err))
    }
  }

  async function openSigned() {
    setError(null)
    setMessage(null)
    try {
      const signed = await orgAdminApi.contractDocumentUrl(contractId)
      setMessage(`서명 URL을 발급했습니다. 만료 ${signed.expiresAt}`)
      window.open(signed.url, '_blank', 'noopener')
    } catch (err) {
      setError(`${orgErrorMessage(err)} 객체 저장소가 없으면 서명 URL은 발급되지 않습니다. 파일 본문은 다운로드로 열 수 있습니다.`)
    }
  }

  return (
    <section className="mb-6 rounded border bg-white p-4" data-testid="contract-files">
      <h2 className="mb-2 text-base font-semibold">계약서 PDF</h2>
      <p className="mb-3 text-sm text-gray-600">전자서명은 없습니다. PDF 파일만 첨부합니다.</p>
      {documents.isLoading ? <p className="text-sm text-gray-500">불러오는 중…</p> : null}
      {documents.error ? <p className="text-sm text-red-700">{orgErrorMessage(documents.error)}</p> : null}
      <p className="text-sm">현재 파일: {current ? current.filename : '없음'}</p>
      {canUpload ? (
        <label className="mt-3 block text-sm">
          PDF 업로드
          <input
            className="mt-1 block text-sm"
            type="file"
            accept="application/pdf,.pdf"
            aria-label="계약서 PDF"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (file.type && file.type !== 'application/pdf') {
                setError('PDF 파일만 첨부할 수 있습니다.')
                return
              }
              upload.mutate(file)
            }}
          />
        </label>
      ) : (
        <p className="mt-2 text-xs text-gray-500">업로드는 본사만 할 수 있습니다.</p>
      )}
      {current ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void openBytes(false)}>
            열람
          </button>
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void openBytes(true)}>
            다운로드
          </button>
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void openSigned()}>
            서명 URL
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-green-800">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {rows.length > 0 ? (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">파일명</th>
              <th>형식</th>
              <th>올린 시각</th>
              <th>버전</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2">{row.filename}</td>
                <td>{row.contentType}</td>
                <td>{row.createdAt}</td>
                <td>{row.versionId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}
