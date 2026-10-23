'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vaultApi, type CreativeAsset } from '@/shared/api/vault'
import { useTranslations } from 'next-intl'
import { Link } from '../../../i18n.config'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, INPUT_BASE, PAGE_CONTAINER, SECTION_GAP, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function VaultPage() {
  const t = useTranslations('common')
  const tVault = useTranslations('vault')
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-semibold text-gray-900">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className={`${TITLE_PAGE} whitespace-normal break-words`}>{tVault('title')}</h1>
            <p className={`${TEXT_SUB} mt-2 whitespace-normal break-words`}>{tVault('hint')}</p>
            <p className={`${TEXT_SUB} mt-2 whitespace-normal break-words`}>{tVault('legal')}</p>
          </div>
          <button type="button" onClick={() => setShowCreateModal(true)} className={`${BTN_PRIMARY} min-h-11 whitespace-normal break-words`}>
            {tVault('add')}
          </button>
        </div>

        {showCreateModal && (
          <CreateAssetModal
            onClose={() => setShowCreateModal(false)}
            onCreate={createMutation.mutate}
            isLoading={createMutation.isPending}
          />
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets?.content && assets.content.length > 0 ? (
            assets.content.map((asset: CreativeAsset) => <AssetCard key={asset.id} asset={asset} />)
          ) : (
            <div className="col-span-full py-12 text-center">
              <p className={TEXT_SUB}>{tVault('empty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function accessLabel(control: string, tVault: (key: string) => string) {
  if (control === 'PUBLIC') return tVault('public')
  if (control === 'AUDITION_ONLY') return tVault('auditionOnly')
  return tVault('private')
}

function AssetCard({ asset }: { asset: CreativeAsset }) {
  const tVault = useTranslations('vault')
  return (
    <Link href={`/vault/${asset.id}`} className="block no-underline">
      <div className={CARD_BASE}>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg text-violet-700">
            ♪
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{asset.title}</h3>
            <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-sm text-blue-700">{asset.assetType}</span>
          </div>
        </div>
        {asset.description ? <p className={`${TEXT_SUB} mb-4 line-clamp-2`}>{asset.description}</p> : null}
        <div className="flex items-center justify-between">
          <span className={TEXT_SUB}>{tVault('registeredAt', { date: new Date(asset.registeredAt).toLocaleDateString() })}</span>
          <span
            className={
              asset.accessControl === 'PUBLIC'
                ? 'rounded-full bg-green-50 px-3 py-0.5 text-sm text-green-700'
                : asset.accessControl === 'AUDITION_ONLY'
                  ? 'rounded-full bg-yellow-50 px-3 py-0.5 text-sm text-yellow-800'
                  : 'rounded-full bg-gray-100 px-3 py-0.5 text-sm text-gray-700'
            }
          >
            {accessLabel(asset.accessControl, tVault)}
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
  const tVault = useTranslations('vault')
  const tCommon = useTranslations('common')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assetType, setAssetType] = useState('LYRIC')
  const [declaredCreationType, setDeclaredCreationType] = useState('HUMAN')
  const [accessControl, setAccessControl] = useState('PRIVATE')
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')

  const handleSubmitForm = (e: React.FormEvent) => {
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
    } else if ((textContent ?? '').trim()) {
      onCreate({
        textContent: (textContent ?? '').trim(),
        title,
        description: description || undefined,
        assetType,
        declaredCreationType: declaredCreationType || undefined,
        accessControl,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`${CARD_BASE} max-h-[90vh] w-full max-w-2xl overflow-y-auto`}>
        <h2 className={`${TITLE_PAGE} mb-4`}>{tVault('createTitle')}</h2>
        <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('fieldTitle')} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT_BASE} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('fieldDescription')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT_BASE} rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('assetType')} *</label>
            <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className={INPUT_BASE} required>
              <option value="LYRIC">{tVault('lyric')}</option>
              <option value="COMPOSITION">{tVault('composition')}</option>
              <option value="DEMO_AUDIO">{tVault('demoAudio')}</option>
              <option value="VOCAL_GUIDE">{tVault('vocalGuide')}</option>
              <option value="STEMS">{tVault('stems')}</option>
              <option value="AI_GENERATED">{tVault('aiGenerated')}</option>
              <option value="AI_ASSISTED">{tVault('aiAssisted')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('creationType')}</label>
            <select value={declaredCreationType} onChange={(e) => setDeclaredCreationType(e.target.value)} className={INPUT_BASE}>
              <option value="HUMAN">{tVault('human')}</option>
              <option value="AI_ASSISTED">{tVault('aiAssisted')}</option>
              <option value="AI_GENERATED">{tVault('aiGen')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('access')} *</label>
            <select value={accessControl} onChange={(e) => setAccessControl(e.target.value)} className={INPUT_BASE} required>
              <option value="PUBLIC">{tVault('public')}</option>
              <option value="AUDITION_ONLY">{tVault('auditionOnly')}</option>
              <option value="PRIVATE">{tVault('private')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('fileUpload')}</label>
            <input
              type="file"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                setFile(selectedFile ?? null)
              }}
              className={INPUT_BASE}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">{tVault('orText')}</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className={INPUT_BASE}
              rows={5}
              placeholder={tVault('textPlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-3 pt-4 md:flex-row">
            <button type="button" onClick={onClose} className={`${BTN_SECONDARY} md:flex-1`}>
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !title || (!file && !(textContent ?? '').trim())}
              className={`${BTN_PRIMARY} md:flex-1`}
            >
              {isLoading ? tVault('registering') : tVault('register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
