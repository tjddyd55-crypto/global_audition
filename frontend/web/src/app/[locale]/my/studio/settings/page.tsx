'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { apiClient } from '@/shared/api/client'
import { meProfileApi } from '@/shared/api/meProfile'
import { INPUT_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioSettingsPage() {
  const t = useTranslations('studio')
  const tCommon = useTranslations('common')
  const profile = useQuery({ queryKey: ['studio', 'profile'], queryFn: meProfileApi.get })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/me/password', { currentPassword, newPassword })
    },
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setMessage(t('passwordChanged'))
    },
    onError: () => setMessage(t('passwordFailed')),
  })

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('settings')}</h2>
      <p className={TEXT_SUB}>{t('settingsHint')}</p>
      <p className="text-sm text-gray-900">
        {t('email')}: {profile.data?.email ?? '—'}
      </p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          setMessage(null)
          save.mutate()
        }}
      >
        <label className="text-sm font-medium">
          {t('currentPassword')}
          <input className={INPUT_BASE} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </label>
        <label className="text-sm font-medium">
          {t('newPassword')}
          <input className={INPUT_BASE} type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={save.isPending} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {tCommon('save')}
        </button>
      </form>
      {message ? <p className={TEXT_SUB}>{message}</p> : null}
    </div>
  )
}
