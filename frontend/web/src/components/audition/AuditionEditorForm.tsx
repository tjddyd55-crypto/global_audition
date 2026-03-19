'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { SIGNUP, HERO, AUDITION_DETAIL } from '@/lib/design-tokens'
import type { AuditionDto, AuditionStatus, CreateAuditionPayload } from '@/lib/types/audition'
import { auditionApi } from '@/lib/api/auditions'
import { isoToDatetimeLocalValue } from '@/lib/audition/datetimeLocal'

const GALLERY_MAX_FILES_PER_PICK = 8
const GALLERY_MAX_BYTES_PER_FILE = 2 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > GALLERY_MAX_BYTES_PER_FILE) {
      resolve(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

function trimNonEmpty(lines: string[] | undefined): string[] {
  return (lines ?? []).map((s) => (s ?? '').trim()).filter((s) => s.length > 0)
}

function StringListEditor({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const list = values.length > 0 ? values : ['']
  const add = () => onChange([...list, ''])
  const setAt = (i: number, v: string) => {
    const next = [...list]
    next[i] = v ?? ''
    onChange(next)
  }
  const remove = (i: number) => {
    const next = list.filter((_, j) => j !== i)
    onChange(next.length > 0 ? next : [])
  }
  return (
    <div style={{ marginBottom: AUDITION_DETAIL.mainGridGapPx }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: AUDITION_DETAIL.galleryGapPx,
        }}
      >
        <label style={{ fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}>{label}</label>
        <button
          type="button"
          onClick={add}
          style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: HERO.primaryGradientStart, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          + 항목 추가
        </button>
      </div>
      {list.map((v, i) => (
        <div
          key={`${label}-row-${i}`}
          style={{ display: 'flex', gap: AUDITION_DETAIL.galleryGapPx, marginBottom: AUDITION_DETAIL.galleryGapPx }}
        >
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
          <button
            type="button"
            onClick={() => remove(i)}
            style={{
              padding: `0 ${AUDITION_DETAIL.benefitCardPaddingPx}px`,
              border: `1px solid ${SIGNUP.inputBorderColor}`,
              borderRadius: SIGNUP.inputRadiusPx,
              background: '#fff',
            }}
          >
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

function applyInitial(a: AuditionDto) {
  return {
    title: a.title ?? '',
    description: a.description ?? '',
    status: (a.status as AuditionStatus) || 'DRAFT',
    category: a.category ?? '',
    coverImage: a.coverImage ?? '',
    videoUrl: a.videoUrl ?? '',
    galleryImages: [...(a.galleryImages ?? [])],
    agencyName: a.agencyName ?? '',
    agencyLogo: a.agencyLogo ?? '',
    recruitFields: [...(a.recruitFields ?? [])],
    qualifications: [...(a.qualifications ?? [])],
    schedules: [...(a.schedules ?? [])],
    benefits: [...(a.benefits ?? [])],
    location: a.location ?? '',
    startDate: isoToDatetimeLocalValue(a.startDate ?? ''),
    endDate: isoToDatetimeLocalValue(a.endDate ?? ''),
  }
}

export type AuditionEditorFormProps = {
  mode: 'create' | 'edit'
  auditionId?: string
  /** edit: 로드된 공고로 폼 채움 */
  initialAudition?: AuditionDto | null
  topSlot?: React.ReactNode
  onSuccess?: (a: AuditionDto) => void
}

export function AuditionEditorForm({ mode, auditionId, initialAudition, topSlot, onSuccess }: AuditionEditorFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<AuditionStatus>('DRAFT')
  const [category, setCategory] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [agencyName, setAgencyName] = useState('')
  const [agencyLogo, setAgencyLogo] = useState('')
  const [recruitFields, setRecruitFields] = useState<string[]>([])
  const [qualifications, setQualifications] = useState<string[]>([])
  const [schedules, setSchedules] = useState<string[]>([])
  const [benefits, setBenefits] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (mode !== 'edit' || !initialAudition) return
    const v = applyInitial(initialAudition)
    setTitle(v.title)
    setDescription(v.description)
    setStatus(v.status)
    setCategory(v.category)
    setCoverImage(v.coverImage)
    setVideoUrl(v.videoUrl)
    setGalleryImages(v.galleryImages)
    setAgencyName(v.agencyName)
    setAgencyLogo(v.agencyLogo)
    setRecruitFields(v.recruitFields)
    setQualifications(v.qualifications)
    setSchedules(v.schedules)
    setBenefits(v.benefits)
    setLocation(v.location)
    setStartDate(v.startDate)
    setEndDate(v.endDate)
  }, [mode, initialAudition])

  const onGalleryFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const urls: string[] = []
    const limit = Math.min(files.length, GALLERY_MAX_FILES_PER_PICK)
    for (let i = 0; i < limit; i++) {
      const dataUrl = await readFileAsDataUrl(files[i])
      if (dataUrl) urls.push(dataUrl)
    }
    e.target.value = ''
    if (!urls.length) return
    const existing = trimNonEmpty(galleryImages)
    setGalleryImages([...existing, ...urls])
  }

  const buildPayload = (): CreateAuditionPayload => ({
    title: (title ?? '').trim(),
    description: (description ?? '').trim(),
    status,
    category: (category ?? '').trim() || '기타',
    coverImage: (coverImage ?? '').trim() || undefined,
    videoUrl: (videoUrl ?? '').trim() || undefined,
    galleryImages: trimNonEmpty(galleryImages),
    agencyName: (agencyName ?? '').trim(),
    agencyLogo: (agencyLogo ?? '').trim() || undefined,
    recruitFields: trimNonEmpty(recruitFields),
    qualifications: trimNonEmpty(qualifications),
    schedules: trimNonEmpty(schedules),
    benefits: trimNonEmpty(benefits),
    location: (location ?? '').trim(),
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
  })

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
    if (mode === 'edit' && !auditionId) {
      setError('공고 ID가 없습니다')
      return
    }

    setIsLoading(true)
    setError(null)
    const payload = buildPayload()

    try {
      if (mode === 'create') {
        const created = await auditionApi.create(payload)
        onSuccess?.(created)
      } else {
        const updated = await auditionApi.update(auditionId!, payload)
        onSuccess?.(updated)
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || (mode === 'create' ? '등록에 실패했습니다' : '수정에 실패했습니다')
      if (mode === 'edit') {
        toast.error(typeof msg === 'string' ? msg : '수정 실패')
      }
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    margin: `${AUDITION_DETAIL.mainGridGapPx}px 0 ${AUDITION_DETAIL.benefitGridGapPx}px 0`,
    borderBottom: `1px solid ${AUDITION_DETAIL.cardBorderColor}`,
    paddingBottom: AUDITION_DETAIL.galleryGapPx,
  }

  const submitLabel = mode === 'create' ? '등록하기' : '저장하기'
  const loadingLabel = mode === 'create' ? '등록 중...' : '저장 중...'

  return (
    <>
      {topSlot}
      {error && (
        <div
          style={{
            marginBottom: AUDITION_DETAIL.benefitGridGapPx,
            padding: AUDITION_DETAIL.benefitCardPaddingPx,
            borderRadius: SIGNUP.cardRadiusPx,
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: AUDITION_DETAIL.bodyFontPx,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ maxWidth: 720 }} className="w-full">
        <h2 style={sectionTitle}>기본 정보</h2>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            title
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            description
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={textareaStyle} required />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            status
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as AuditionStatus)} style={inputStyle}>
            <option value="DRAFT">DRAFT</option>
            <option value="OPEN">OPEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            category
          </label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
        </div>

        <h2 style={sectionTitle}>미디어</h2>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            coverImage (URL)
          </label>
          <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} style={inputStyle} placeholder="https://..." />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            videoUrl
          </label>
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={inputStyle} placeholder="YouTube URL" />
        </div>
        <StringListEditor label="galleryImages (URL)" values={galleryImages} onChange={setGalleryImages} />
        <div style={{ marginBottom: AUDITION_DETAIL.mainGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            galleryImages — 파일 여러 장 (임시 data URL, {Math.round(GALLERY_MAX_BYTES_PER_FILE / (1024 * 1024))}MB/파일)
          </label>
          <input type="file" accept="image/*" multiple onChange={onGalleryFiles} style={{ fontSize: AUDITION_DETAIL.metaMutedPx }} />
        </div>

        <h2 style={sectionTitle}>기획사</h2>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            agencyName
          </label>
          <input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            agencyLogo (URL)
          </label>
          <input value={agencyLogo} onChange={(e) => setAgencyLogo(e.target.value)} style={inputStyle} />
        </div>

        <h2 style={sectionTitle}>위치 · 일정</h2>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            location
          </label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            startDate
          </label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} required />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 500 }}
          >
            endDate
          </label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} required />
        </div>

        <h2 style={sectionTitle}>모집 · 자격 · 일정 (배열)</h2>
        <StringListEditor label="recruitFields" values={recruitFields} onChange={setRecruitFields} />
        <StringListEditor label="qualifications" values={qualifications} onChange={setQualifications} />
        <StringListEditor label="schedules" values={schedules} onChange={setSchedules} />

        <h2 style={sectionTitle}>혜택 (benefits)</h2>
        <StringListEditor label="benefits" values={benefits} onChange={setBenefits} />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full max-w-[400px] md:max-w-none md:w-auto"
          style={{
            marginTop: AUDITION_DETAIL.mainGridGapPx,
            height: HERO.buttonHeightPx,
            borderRadius: HERO.buttonRadiusPx,
            border: 'none',
            background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
            color: '#fff',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? loadingLabel : submitLabel}
        </button>
      </form>
    </>
  )
}
