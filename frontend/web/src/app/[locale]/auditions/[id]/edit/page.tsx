'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/auth/authStore'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { LAYOUT, HERO, AUDITION_DETAIL } from '@/shared/design-tokens'
import { toast } from 'sonner'
import { AuditionEditorForm } from '@/components/audition/AuditionEditorForm'
import { canManageAudition } from '@/shared/audition/auditionPermissions'

export default function AuditionEditPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('common')
  const tEditor = useTranslations('editor')
  const id = params.id as string
  const [gateReady, setGateReady] = useState(false)

  const accessToken = useAuthStore((s) => s.accessToken)
  const userId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  const allowed = useMemo(
    () =>
      canManageAudition({
        accessToken,
        userId,
        ownerId: audition?.ownerId,
        role,
      }),
    [accessToken, userId, audition?.ownerId, role]
  )

  useEffect(() => {
    if (!authApi.getToken()) {
      router.replace('/login')
      return
    }
    setGateReady(true)
  }, [router])

  useEffect(() => {
    if (!audition || !userId) return
    if (!canManageAudition({ accessToken, userId, ownerId: audition.ownerId, role })) {
      router.replace('/')
    }
  }, [audition, userId, role, accessToken, router, id])

  if (!gateReady) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loading')}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loading')}
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }}>
        {t('error')}
      </div>
    )
  }

  if (!allowed) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loading')}
      </div>
    )
  }

  return (
    <div
      className="mx-auto w-full max-w-[min(1400px,100%)] px-4 md:px-6"
      style={{
        paddingTop: LAYOUT.sectionGapPx,
        paddingBottom: LAYOUT.sectionGapPx,
      }}
    >
      <div
        style={{
          marginBottom: AUDITION_DETAIL.mainGridGapPx,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: AUDITION_DETAIL.galleryGapPx,
        }}
      >
        <h1 className="text-lg md:text-2xl" style={{ margin: 0, fontWeight: 700 }}>
          {tEditor('editPosting')}
        </h1>
        <Link
          href={`/auditions/${id}`}
          className="w-full text-sm md:w-auto md:text-base"
          style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: HERO.primaryGradientStart }}
        >
          {tEditor('backToPublicDetail')}
        </Link>
      </div>

      <AuditionEditorForm
        mode="edit"
        auditionId={id}
        initialAudition={audition}
        onSuccess={() => {
          toast.success(tEditor('savedRedirect'), { duration: 3500 })
          router.push(`/auditions/${id}`)
        }}
      />
    </div>
  )
}
