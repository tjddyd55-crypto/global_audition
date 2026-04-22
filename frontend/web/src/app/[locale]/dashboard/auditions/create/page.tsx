'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '../../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { LAYOUT, HERO, AUDITION_DETAIL } from '@/shared/design-tokens'
import { AuditionEditorForm } from '@/components/audition/AuditionEditorForm'

export default function DashboardAuditionCreatePage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/login')
      return
    }
    const role = localStorage.getItem('userRole')
    if (role !== 'AGENCY' && role !== 'ADMIN') {
      setError('기획사만 오디션을 등록할 수 있습니다')
      setTimeout(() => router.push('/'), 2000)
    } else {
      setAllowed(true)
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {t('loading')}
      </div>
    )
  }
  if (!allowed) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }}>
        {error}
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
        style={{ marginBottom: AUDITION_DETAIL.mainGridGapPx, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: AUDITION_DETAIL.galleryGapPx }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>오디션 등록</h1>
        <Link href="/my/auditions" style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: HERO.primaryGradientStart }}>
          내 공고 목록
        </Link>
      </div>

      <AuditionEditorForm
        mode="create"
        onSuccess={(a) => router.push(`/auditions/${a.id}`)}
      />
    </div>
  )
}
