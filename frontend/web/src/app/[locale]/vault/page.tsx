'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vaultApi, type CreativeAsset } from '../../../lib/api/vault'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function VaultPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: assets, isLoading } = useQuery({
    queryKey: ['myAssets'],
    queryFn: () => vaultApi.getMyAssets({ page: 0, size: 50 }),
  })

  const createMutation = useMutation({
    mutationFn: (params: Parameters<typeof vaultApi.createAsset>[0]) => vaultApi.createAsset(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssets'] })
      setShowCreateModal(false)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">창작물 보관소</h1>
            <p className="text-gray-600">
              업로드 즉시 존재 확인 기록이 생성됩니다.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              본 플랫폼은 저작권 등록기관이 아니며, 업로더 선언과 기록을 저장합니다.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
          >
            + 창작물 등록
          </button>
        </div>

        {showCreateModal && (
          <CreateAssetModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createMutation.mutate}
            isLoading={createMutation.isPending}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets?.content && assets.content.length > 0 ? (
            assets.content.map((asset: CreativeAsset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p>등록된 창작물이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AssetCard({ asset }: { asset: CreativeAsset }) {
  return (
    <Link href={`/vault/${asset.id}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">{asset.title}</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {asset.assetType}
          </span>
        </div>
        {asset.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{asset.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>등록일: {new Date(asset.registeredAt).toLocaleDateString('ko-KR')}</span>
          <span className={`px-2 py-1 rounded ${
            asset.accessControl === 'PUBLIC' ? 'bg-green-100 text-green-800' :
            asset.accessControl === 'AUDITION_ONLY' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {asset.accessControl === 'PUBLIC' ? '공개' :
             asset.accessControl === 'AUDITION_ONLY' ? '오디션만' : '비공개'}
          </span>
        </div>
      </div>
    </Link>
  )
}

function CreateAssetModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void
  onCreate: (params: Parameters<typeof vaultApi.createAsset>[0]) => void
  isLoading: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assetType, setAssetType] = useState('LYRIC')
  const [declaredCreationType, setDeclaredCreationType] = useState('HUMAN')
  const [accessControl, setAccessControl] = useState('PRIVATE')
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    if (file) {
      onCreate({
        file,
        title,
        description: description || undefined,
        assetType,
        declaredCreationType: declaredCreationType || undefined,
        accessControl,
      })
    } else if (textContent.trim()) {
      onCreate({
        textContent: textContent.trim(),
        title,
        description: description || undefined,
        assetType,
        declaredCreationType: declaredCreationType || undefined,
        accessControl,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">창작물 등록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">자산 타입 *</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            >
              <option value="LYRIC">가사</option>
              <option value="COMPOSITION">악보/미디</option>
              <option value="DEMO_AUDIO">데모 음원</option>
              <option value="VOCAL_GUIDE">가이드 보컬</option>
              <option value="STEMS">스텝/트랙</option>
              <option value="AI_GENERATED">AI 생성물</option>
              <option value="AI_ASSISTED">AI 보조</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">창작 방식</label>
            <select
              value={declaredCreationType}
              onChange={(e) => setDeclaredCreationType(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="HUMAN">인간 창작</option>
              <option value="AI_ASSISTED">AI 보조</option>
              <option value="AI_GENERATED">AI 생성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">공개 범위 *</label>
            <select
              value={accessControl}
              onChange={(e) => setAccessControl(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            >
              <option value="PUBLIC">공개</option>
              <option value="AUDITION_ONLY">오디션만</option>
              <option value="PRIVATE">비공개</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">파일 업로드</label>
            <input
              type="file"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  // TODO: 파일 크기 제한 검증 (50MB)
                  // if (selectedFile.size > 50 * 1024 * 1024) {
                  //   alert('파일 크기는 50MB를 초과할 수 없습니다')
                  //   return
                  // }
                  
                  // TODO: 파일 확장자 검증
                  // const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.webm', '.mp3', '.wav', '.flac', '.aac', '.mid', '.midi', '.m4a', '.ogg']
                  // const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
                  // if (!allowedExtensions.includes(fileExtension)) {
                  //   alert('지원하지 않는 파일 형식입니다')
                  //   return
                  // }
                  
                  // TODO: MIME 타입 체크
                  // const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', ...]
                  // if (!allowedMimeTypes.includes(selectedFile.type)) {
                  //   alert('지원하지 않는 파일 형식입니다')
                  //   return
                  // }
                  
                  setFile(selectedFile)
                } else {
                  setFile(null)
                }
              }}
              className="w-full border rounded-lg px-4 py-2"
            />
            {/* TODO: 파일 크기 제한 안내 메시지 추가 */}
            {/* <p className="text-xs text-gray-500 mt-1">최대 50MB까지 업로드 가능</p> */}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">또는 텍스트 입력 (가사 등)</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              rows={5}
              placeholder="텍스트를 입력하세요..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !title || (!file && !textContent.trim())}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
