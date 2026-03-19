'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from '../../../../../i18n.config'
import { auditionApi } from '../../../../../lib/api/auditions'
import { authApi } from '../../../../../lib/api/auth'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { LAYOUT, SIGNUP, HERO, AUDITION_DETAIL } from '../../../../../lib/design-tokens'
import type { AuditionDetailContent, AuditionStatus, CreateAuditionPayload } from '../../../../../lib/types/audition'
import { emptyDetailContent } from '../../../../../lib/types/audition'

function StringListEditor({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const add = () => onChange([...values, ''])
  const setAt = (i: number, v: string) => {
    const next = [...values]
    next[i] = v
    onChange(next)
  }
  const remove = (i: number) => onChange(values.filter((_, j) => j !== i))
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>{label}</label>
        <button type="button" onClick={add} style={{ fontSize: 13, color: HERO.primaryGradientStart, background: 'none', border: 'none', cursor: 'pointer' }}>
          + 항목 추가
        </button>
      </div>
      {values.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={v}
            onChange={(e) => setAt(i, e.target.value)}
            style={{
              flex: 1,
              height: SIGNUP.inputHeightPx,
              borderRadius: SIGNUP.inputRadiusPx,
              border: `1px solid ${SIGNUP.inputBorderColor}`,
              padding: `0 ${SIGNUP.inputPaddingPx}px`,
              fontSize: SIGNUP.inputFontSizePx,
            }}
          />
          <button type="button" onClick={() => remove(i)} style={{ padding: '0 12px', border: `1px solid ${SIGNUP.inputBorderColor}`, borderRadius: SIGNUP.inputRadiusPx, background: '#fff' }}>
            삭제
          </button>
        </div>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: SIGNUP.inputHeightPx,
  borderRadius: SIGNUP.inputRadiusPx,
  border: `1px solid ${SIGNUP.inputBorderColor}`,
  padding: `0 ${SIGNUP.inputPaddingPx}px`,
  fontSize: SIGNUP.inputFontSizePx,
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: 120,
  paddingTop: 10,
  paddingBottom: 10,
  resize: 'vertical' as const,
}

export default function DashboardAuditionCreatePage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [allowed, setAllowed] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<AuditionStatus>('DRAFT')
  const [category, setCategory] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([''])
  const [agencyName, setAgencyName] = useState('')
  const [agencyLogo, setAgencyLogo] = useState('')
  const [recruitFields, setRecruitFields] = useState<string[]>([''])
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [detail, setDetail] = useState<AuditionDetailContent>(emptyDetailContent())
  const [benefitsTop, setBenefitsTop] = useState<string[]>([''])

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!(title ?? '').trim()) {
      setError('제목을 입력해주세요')
      return
    }
    if (!(description ?? '').trim()) {
      setError('설명을 입력해주세요')
      return
    }
    if (!(agencyName ?? '').trim() || !(location ?? '').trim()) {
      setError('기획사명과 위치를 입력해주세요')
      return
    }
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 입력해주세요')
      return
    }
    setIsLoading(true)
    setError(null)
    const gallery = galleryImages.map((s) => s.trim()).filter(Boolean)
    const recruits = recruitFields.map((s) => s.trim()).filter(Boolean)
    const ben = benefitsTop.map((s) => s.trim()).filter(Boolean)
    const detailMerged: AuditionDetailContent = {
      recruit: detail.recruit.map((s) => s.trim()).filter(Boolean).length ? detail.recruit.map((s) => s.trim()).filter(Boolean) : recruits,
      qualification: detail.qualification.map((s) => s.trim()).filter(Boolean),
      schedule: detail.schedule.map((s) => s.trim()).filter(Boolean),
      benefits: detail.benefits.map((s) => s.trim()).filter(Boolean).length ? detail.benefits.map((s) => s.trim()).filter(Boolean) : ben,
    }
    const payload: CreateAuditionPayload = {
      title: title.trim(),
      description: description.trim(),
      status,
      category: category.trim() || '기타',
      coverImage: coverImage.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      galleryImages: gallery,
      agencyName: agencyName.trim(),
      agencyLogo: agencyLogo.trim() || undefined,
      recruitFields: detailMerged.recruit,
      location: location.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      detailContent: {
        ...detailMerged,
        benefits: ben.length ? ben : detailMerged.benefits,
      },
      benefits: ben.length ? ben : detailMerged.benefits,
    }
    try {
      const created = await auditionApi.create(payload)
      router.push(`/auditions/${created.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || '등록에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

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

  const sectionTitle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    margin: '32px 0 16px 0',
    borderBottom: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
    paddingBottom: 8,
  }

  return (
    <div
      style={{
        maxWidth: LAYOUT.containerMaxWidth,
        margin: '0 auto',
        padding: `${LAYOUT.sectionGapPx}px ${LAYOUT.containerPaddingPx}px`,
      }}
    >
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>오디션 등록</h1>
        <Link href="/my/auditions" style={{ fontSize: 14, color: HERO.primaryGradientStart }}>
          내 공고 목록
        </Link>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: SIGNUP.cardRadiusPx, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ maxWidth: 720 }}>
        <h2 style={sectionTitle}>기본 정보</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={textareaStyle} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as AuditionStatus)} style={inputStyle}>
            <option value="DRAFT">DRAFT</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
        </div>

        <h2 style={sectionTitle}>미디어</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>coverImage (URL)</label>
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>videoUrl</label>
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={inputStyle} placeholder="YouTube URL" />
        </div>
        <StringListEditor label="galleryImages" values={galleryImages} onChange={setGalleryImages} />

        <h2 style={sectionTitle}>기획사</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>agencyName</label>
          <input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>agencyLogo (URL)</label>
          <input value={agencyLogo} onChange={(e) => setAgencyLogo(e.target.value)} style={inputStyle} />
        </div>

        <h2 style={sectionTitle}>통계 / 메타</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>startDate</label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>endDate</label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} required />
        </div>

        <h2 style={sectionTitle}>모집 정보 (detailContent)</h2>
        <StringListEditor label="recruit" values={detail.recruit.length ? detail.recruit : ['']} onChange={(v) => setDetail({ ...detail, recruit: v.length ? v : [''] })} />
        <StringListEditor label="qualification" values={detail.qualification.length ? detail.qualification : ['']} onChange={(v) => setDetail({ ...detail, qualification: v.length ? v : [''] })} />
        <StringListEditor label="schedule" values={detail.schedule.length ? detail.schedule : ['']} onChange={(v) => setDetail({ ...detail, schedule: v.length ? v : [''] })} />
        <StringListEditor label="benefits (detailContent)" values={detail.benefits.length ? detail.benefits : ['']} onChange={(v) => setDetail({ ...detail, benefits: v.length ? v : [''] })} />

        <h2 style={sectionTitle}>recruitFields</h2>
        <StringListEditor label="recruitFields" values={recruitFields} onChange={setRecruitFields} />

        <h2 style={sectionTitle}>혜택 카드 (benefits)</h2>
        <StringListEditor label="benefits" values={benefitsTop} onChange={setBenefitsTop} />

        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: 24,
            width: '100%',
            maxWidth: 400,
            height: 44,
            borderRadius: HERO.buttonRadiusPx,
            border: 'none',
            background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
            color: '#fff',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '저장 중...' : '등록하기'}
        </button>
      </form>
    </div>
  )
}
