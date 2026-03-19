'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '../../../../../lib/api/auditions'
import { authApi } from '../../../../../lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { LAYOUT, HERO, AUDITION_DETAIL } from '../../../../../lib/design-tokens'
import { AuditionEditorForm } from '@/components/audition/AuditionEditorForm'

export default function AuditionEditPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('common')
  const id = params.id as string
  const [gateReady, setGateReady] = useState(false)

  const userId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (!authApi.getToken()) {
      router.replace('/login')
      return
    }
    setGateReady(true)
  }, [router])

  useEffect(() => {
    if (!audition || !userId) return
    const isOwner = audition.ownerId === userId
    const isAgencyOrAdmin = role === 'ADMIN' || role === 'AGENCY'
    if (!isOwner && !isAgencyOrAdmin) {
      router.replace(`/auditions/${id}`)
    }
  }, [audition, userId, role, id, router])

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

  return (
    <div
      className="mx-auto w-full max-w-[1200px] px-4 md:px-6"
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>공고 수정</h1>
        <Link href={`/auditions/${id}`} style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: HERO.primaryGradientStart }}>
          상세로 돌아가기
        </Link>
      </div>

      <AuditionEditorForm
        mode="edit"
        auditionId={id}
        initialAudition={audition}
        onSuccess={() => router.push(`/auditions/${id}`)}
      />
    </div>
  )
}
