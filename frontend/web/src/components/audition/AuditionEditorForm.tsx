'use client'

import { useEffect, useMemo, useState, type FormEvent, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SIGNUP, HERO, AUDITION_DETAIL } from '@/lib/design-tokens'
import {
  buildAuditionImagesPayload,
  EMPTY_AUDITION_FORM_IMAGES,
  type AuditionDto,
  type AuditionFormImages,
  type AuditionStatus,
  type CreateAuditionPayload,
} from '@/lib/types/audition'
import { auditionApi } from '@/lib/api/auditions'
import { fetchTagCatalog } from '@/lib/api/tags'
import { apiErrorMessage } from '@/lib/api/uploads'
import { isoToDatetimeLocalValue } from '@/lib/audition/datetimeLocal'
import { isBlankOrValidYoutubeUrl } from '@/lib/audition/youtubeEmbed'
import { AuditionEditorPreview } from '@/components/audition/AuditionEditorPreview'
import { SingleImageUploadField } from '@/components/audition/AuditionEditorImageUpload'
import { ImageUploader } from '@/components/common/ImageUploader'
import { EDITOR_LABELS, AUDITION_STATUS_LABEL_KO } from '@/lib/audition/auditionEditorCopy'
import { normalizeCustomTagNamesForPayload } from '@/lib/audition/auditionTags'

function trimNonEmpty(lines: string[] | undefined): string[] {
  return (lines ?? []).map((s) => (s ?? '').trim()).filter((s) => s.length > 0)
}

function defaultDatetimeLocalStart(): string {
  return isoToDatetimeLocalValue(new Date().toISOString())
}

function defaultDatetimeLocalEnd(): string {
  return isoToDatetimeLocalValue(new Date(Date.now() + 30 * 86400000).toISOString())
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
  const im = a.images
  const images: AuditionFormImages = {
    original: im?.original ?? '',
    medium: im?.medium ?? '',
    thumb: im?.thumb ?? '',
  }
  return {
    title: a.title ?? '',
    description: a.description ?? '',
    status: (a.status as AuditionStatus) || 'DRAFT',
    images,
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
  initialAudition?: AuditionDto | null
  topSlot?: React.ReactNode
  /** 게시(OPEN) 저장 성공 시에만 호출 — 임시저장(DRAFT) 시에는 호출하지 않음 */
  onSuccess?: (a: AuditionDto) => void
}

export function AuditionEditorForm({ mode, auditionId, initialAudition, topSlot, onSuccess }: AuditionEditorFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  /** 필수·검증 실패 시 빨간 테두리 */
  const [showTitleError, setShowTitleError] = useState(false)
  const [showDescriptionError, setShowDescriptionError] = useState(false)
  const [showVideoUrlError, setShowVideoUrlError] = useState(false)
  const [showCoverError, setShowCoverError] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  /** 임시 저장 직후 상단 안내 (토스트 보강) */
  const [draftSavedBanner, setDraftSavedBanner] = useState(false)
  /** 신규 작성: 첫 임시저장 후 PATCH에 사용 */
  const [draftId, setDraftId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<AuditionStatus>('DRAFT')
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [tagCustomInput, setTagCustomInput] = useState('')

  const { data: tagCatalog = [], isLoading: tagCatalogLoading } = useQuery({
    queryKey: ['tag-catalog'],
    queryFn: fetchTagCatalog,
    staleTime: 60_000,
  })
  const [images, setImages] = useState<AuditionFormImages>(() => ({ ...EMPTY_AUDITION_FORM_IMAGES }))
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

  const effectiveId = mode === 'edit' ? auditionId : draftId

  useEffect(() => {
    if (mode !== 'create') return
    setStartDate((s) => s || defaultDatetimeLocalStart())
    setEndDate((e) => e || defaultDatetimeLocalEnd())
  }, [mode])

  useEffect(() => {
    if (mode !== 'edit' || !initialAudition) return
    const v = applyInitial(initialAudition)
    setTitle(v.title)
    setDescription(v.description)
    setStatus(v.status)
    setTagCustomInput('')
    setImages(v.images)
    setVideoUrl(v.videoUrl)
    setGalleryImages(v.galleryImages)
    setAgencyName(v.agencyName)
    setAgencyLogo(v.agencyLogo)
    setRecruitFields(v.recruitFields)
    setQualifications(v.qualifications)
    setSchedules(v.schedules)
    setBenefits(v.benefits)
    setLocation(v.location)
    setStartDate(v.startDate || defaultDatetimeLocalStart())
    setEndDate(v.endDate || defaultDatetimeLocalEnd())
  }, [mode, initialAudition])

  useEffect(() => {
    if (mode === 'create') {
      setSelectedCatalogIds([])
      setCustomTags([])
      setTagCustomInput('')
    }
  }, [mode])

  useEffect(() => {
    if (mode !== 'edit' || !initialAudition) return

    const refs = initialAudition.tagRefs
    if (refs && refs.length > 0) {
      const ids: string[] = []
      const customs: string[] = []
      for (const r of refs) {
        if (r.tagId) ids.push(r.tagId)
        else if (r.name.trim()) customs.push(r.name.trim())
      }
      setSelectedCatalogIds([...new Set(ids)])
      setCustomTags(normalizeCustomTagNamesForPayload(customs))
      return
    }

    const names = initialAudition.tags ?? []
    if (names.length === 0) {
      setSelectedCatalogIds([])
      setCustomTags([])
      return
    }
    const byName = new Map(tagCatalog.map((t) => [t.name.trim().toLowerCase(), t.id]))
    const ids: string[] = []
    const customs: string[] = []
    for (const raw of names) {
      const n = raw.trim()
      if (!n) continue
      const id = byName.get(n.toLowerCase())
      if (id) ids.push(id)
      else customs.push(n)
    }
    setSelectedCatalogIds([...new Set(ids)])
    setCustomTags(normalizeCustomTagNamesForPayload(customs))
  }, [mode, initialAudition, tagCatalog])

  const previewTagLabels = useMemo(() => {
    const catMap = new Map(tagCatalog.map((t) => [t.id, t.name]))
    const out: string[] = []
    for (const id of selectedCatalogIds) {
      const n = catMap.get(id)
      if (n) out.push(n)
    }
    out.push(...customTags)
    return out
  }, [tagCatalog, selectedCatalogIds, customTags])

  const buildPayload = (forcedStatus: AuditionStatus): CreateAuditionPayload => {
    const sd = startDate || defaultDatetimeLocalStart()
    const ed = endDate || defaultDatetimeLocalEnd()
    return {
      title: (title ?? '').trim(),
      description: (description ?? '').trim() || '—',
      status: forcedStatus,
      tagIds: [...selectedCatalogIds],
      customTagNames: normalizeCustomTagNamesForPayload(customTags),
      images: buildAuditionImagesPayload(images),
      videoUrl: (videoUrl ?? '').trim() || undefined,
      galleryImages: trimNonEmpty(galleryImages),
      agencyName: (agencyName ?? '').trim() || '미지정',
      agencyLogo: (agencyLogo ?? '').trim() || undefined,
      recruitFields: trimNonEmpty(recruitFields),
      qualifications: trimNonEmpty(qualifications),
      schedules: trimNonEmpty(schedules),
      benefits: trimNonEmpty(benefits),
      location: (location ?? '').trim() || '미지정',
      startDate: new Date(sd).toISOString(),
      endDate: new Date(ed).toISOString(),
    }
  }

  const validate = (intent: 'draft' | 'publish'): string | null => {
    if (!(title ?? '').trim()) {
      setShowTitleError(true)
      return '제목을 입력해 주세요.'
    }
    setShowTitleError(false)

    if (intent === 'publish') {
      if (!(description ?? '').trim() || (description ?? '').trim() === '—') {
        setShowDescriptionError(true)
        return '게시하려면 상세 설명을 입력해 주세요.'
      }
      setShowDescriptionError(false)
      if (!(images.original ?? '').trim() && !(images.medium ?? '').trim() && !(images.thumb ?? '').trim()) {
        setShowCoverError(true)
        return '게시하려면 대표 이미지를 업로드해 주세요.'
      }
      setShowCoverError(false)
      if (!isBlankOrValidYoutubeUrl(videoUrl)) {
        setShowVideoUrlError(true)
        return '영상은 YouTube URL만 입력할 수 있습니다.'
      }
      setShowVideoUrlError(false)
      if (!(agencyName ?? '').trim()) return '게시하려면 기획사명을 입력해 주세요.'
      if (!(location ?? '').trim()) return '게시하려면 위치를 입력해 주세요.'
      if (!startDate || !endDate) return '시작일과 종료일을 입력해 주세요.'
    } else {
      setShowDescriptionError(false)
      setShowVideoUrlError(false)
      setShowCoverError(false)
    }
    return null
  }

  const persist = async (intent: 'draft' | 'publish') => {
    const err = validate(intent)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    const forced: AuditionStatus = intent === 'draft' ? 'DRAFT' : 'OPEN'
    const payload = buildPayload(forced)

    if (mode === 'create' && !effectiveId) {
      setIsLoading(true)
      try {
        const created = await auditionApi.create(payload)
        setDraftId(created.id)
        setStatus(forced)
        if (intent === 'draft') {
          setDraftSavedBanner(true)
          toast.success('임시 저장되었습니다', { duration: 5000 })
        } else {
          setDraftSavedBanner(false)
          toast.success('공고가 등록되었습니다', { duration: 4000 })
        }
        if (intent === 'publish') onSuccess?.(created)
      } catch (e: unknown) {
        const msg = apiErrorMessage(e)
        setError(msg || '저장에 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
      return
    }

    const id = mode === 'edit' ? auditionId! : draftId!
    setIsLoading(true)
    try {
      const updated = await auditionApi.update(id, payload)
      setStatus(forced)
      if (intent === 'draft') {
        setDraftSavedBanner(true)
        toast.success('임시 저장되었습니다', { duration: 5000 })
      } else {
        setDraftSavedBanner(false)
        toast.success('공고가 등록되었습니다', { duration: 4000 })
      }
      if (intent === 'publish') onSuccess?.(updated)
    } catch (e: unknown) {
      const msg = apiErrorMessage(e)
      setError(msg || '저장에 실패했습니다.')
      if (mode === 'edit') toast.error(msg || '저장 실패')
    } finally {
      setIsLoading(false)
    }
  }

  const persistClosed = async () => {
    const err = validate('publish')
    if (err) {
      setError('마감 저장 전에 게시와 동일한 필수 항목을 채워 주세요.')
      return
    }
    if (mode === 'create' && !effectiveId) {
      setError('먼저 임시 저장 또는 게시로 공고를 만든 뒤 마감할 수 있습니다.')
      return
    }
    const id = mode === 'edit' ? auditionId! : draftId!
    setIsLoading(true)
    setError(null)
    try {
      const payload = buildPayload('CLOSED')
      await auditionApi.update(id, payload)
      setStatus('CLOSED')
      toast.success('마감 상태로 저장되었습니다.')
    } catch (e: unknown) {
      const msg = apiErrorMessage(e)
      setError(msg || '저장에 실패했습니다.')
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

  useEffect(() => {
    if (!draftSavedBanner) return
    const t = window.setTimeout(() => setDraftSavedBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [draftSavedBanner])

  const titleInputStyle: CSSProperties = {
    ...inputStyle,
    borderColor: showTitleError ? '#ef4444' : SIGNUP.inputBorderColor,
    borderWidth: showTitleError ? 2 : 1,
  }
  const descriptionInputStyle: CSSProperties = {
    ...textareaStyle,
    borderColor: showDescriptionError ? '#ef4444' : SIGNUP.inputBorderColor,
    borderWidth: showDescriptionError ? 2 : 1,
  }
  const videoInputStyle: CSSProperties = {
    ...inputStyle,
    borderColor: showVideoUrlError ? '#ef4444' : SIGNUP.inputBorderColor,
    borderWidth: showVideoUrlError ? 2 : 1,
  }

  const formBusy = isLoading || logoUploading

  const formCol = (
    <div className="min-w-0 w-full lg:w-[60%]">
      <form
        onSubmit={(e: FormEvent) => e.preventDefault()}
        className="w-full max-w-none"
      >
        <h2 style={sectionTitle}>{EDITOR_LABELS.sectionBasic}</h2>
        {draftSavedBanner && (
          <div
            role="status"
            className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <span>
              <strong>임시 저장됨</strong> — 서버에 반영되었습니다. 이어서 수정한 뒤 다시 임시 저장하거나 등록할 수 있습니다.
            </span>
            <button
              type="button"
              className="shrink-0 text-emerald-700 underline"
              onClick={() => setDraftSavedBanner(false)}
            >
              닫기
            </button>
          </div>
        )}
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.title}{' '}
            <span className="text-red-600" aria-hidden>
              *
            </span>
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setShowTitleError(false)
            }}
            style={titleInputStyle}
            placeholder="예: 2025 글로벌 보컬 오디션"
            aria-invalid={showTitleError}
            required
          />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.description}{' '}
            <span className="text-red-600" aria-hidden>
              *
            </span>
            <span className="ml-1 text-xs font-normal text-gray-500">(등록·마감 시 필수)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setShowDescriptionError(false)
            }}
            style={descriptionInputStyle}
            placeholder="모집 내용, 자격 요건, 진행 방식 등을 적어 주세요."
            aria-invalid={showDescriptionError}
          />
        </div>

        {mode === 'edit' && (
          <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
            <label
              style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
            >
              {EDITOR_LABELS.status}
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AuditionStatus)} style={inputStyle}>
              {(Object.keys(AUDITION_STATUS_LABEL_KO) as AuditionStatus[]).map((s) => (
                <option key={s} value={s}>
                  {AUDITION_STATUS_LABEL_KO[s]}
                </option>
              ))}
            </select>
            <p style={{ marginTop: AUDITION_DETAIL.galleryGapPx, fontSize: 12, color: '#6b7280' }}>
              「임시 저장」은 임시저장(DRAFT), 「등록하기」는 게시중(OPEN)으로 저장합니다. 마감은 아래 버튼을 사용하세요.
            </p>
          </div>
        )}

        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.tags}
          </label>
          <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#6b7280' }}>{EDITOR_LABELS.tagsHint}</p>
          {tagCatalogLoading ? (
            <p className="text-sm text-gray-500">태그 목록 불러오는 중…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagCatalog.map((tag) => {
                const on = selectedCatalogIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedCatalogIds((prev) =>
                        prev.includes(tag.id) ? prev.filter((x) => x !== tag.id) : [...prev, tag.id],
                      )
                    }
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      border: on ? 'none' : `1px solid ${SIGNUP.inputBorderColor}`,
                      background: on
                        ? `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`
                        : '#f9fafb',
                      color: on ? '#fff' : '#374151',
                      fontSize: SIGNUP.inputFontSizePx,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    #{tag.name}
                  </button>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: AUDITION_DETAIL.galleryGapPx }}>
            <div className="flex flex-wrap gap-2" style={{ marginBottom: AUDITION_DETAIL.galleryGapPx }}>
              {customTags.map((ct) => (
                <span
                  key={`custom-${ct}`}
                  className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm text-violet-800"
                >
                  {ct}
                  <button
                    type="button"
                    className="rounded px-1 text-violet-600 hover:bg-violet-100"
                    aria-label={`${ct} 제거`}
                    onClick={() => setCustomTags((prev) => prev.filter((x) => x !== ct))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={tagCustomInput}
                onChange={(e) => setTagCustomInput(e.target.value)}
                placeholder="직접 입력 후 추가"
                className="min-w-[12rem] flex-1"
                style={{
                  ...inputStyle,
                  maxWidth: 480,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const next = normalizeCustomTagNamesForPayload([tagCustomInput])
                    if (next.length === 0) return
                    const label = next[0]!
                    setCustomTags((prev) => normalizeCustomTagNamesForPayload([...prev, label]))
                    setTagCustomInput('')
                  }
                }}
              />
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  const next = normalizeCustomTagNamesForPayload([tagCustomInput])
                  if (next.length === 0) return
                  const label = next[0]!
                  setCustomTags((prev) => normalizeCustomTagNamesForPayload([...prev, label]))
                  setTagCustomInput('')
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>

        <h2 style={sectionTitle}>{EDITOR_LABELS.sectionMedia}</h2>
        <ImageUploader
          className="mb-8"
          label={
            <>
              {EDITOR_LABELS.coverImage}{' '}
              <span className="text-red-600" aria-hidden>
                *
              </span>
              <span className="ml-1 text-xs font-normal text-gray-500">(등록·마감 시 필수)</span>
            </>
          }
          guide="세로형 (3:4) 권장. 카드·리스트·상단 히어로에 동일 비율(3:4, cover)로 표시됩니다."
          multiple={false}
          aspect="portrait"
          maxCount={1}
          uploadDir="audition"
          value={
            images.medium.trim()
              ? [images.medium.trim()]
              : images.original.trim()
                ? [images.original.trim()]
                : []
          }
          onChange={(urls) => {
            if (!(urls[0] ?? '').trim()) {
              setImages({ ...EMPTY_AUDITION_FORM_IMAGES })
            }
            /* 업로드 성공 시 3종은 onAuditionCoverUrls(setImages)에서만 반영 */
            setShowCoverError(false)
          }}
          onAuditionCoverUrls={(urls) => {
            setImages({ original: urls.original, medium: urls.medium, thumb: urls.thumb })
            setShowCoverError(false)
          }}
          disabled={isLoading}
          showFieldError={showCoverError}
        />
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.videoUrl}
            <span className="ml-1 text-xs font-normal text-gray-500">(YouTube만, 등록·마감 시 형식 검사)</span>
          </label>
          <input
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value)
              setShowVideoUrlError(false)
            }}
            style={videoInputStyle}
            placeholder="https://www.youtube.com/watch?v=… 또는 youtu.be/…"
            aria-invalid={showVideoUrlError}
          />
        </div>
        <ImageUploader
          className="mb-8"
          label={EDITOR_LABELS.galleryImages}
          guide="가로형 (16:9) 권장. 상세 페이지 갤러리 영역은 16:9 · contain으로 표시됩니다. 드래그로 순서를 바꿀 수 있습니다."
          multiple
          aspect="landscape"
          maxCount={10}
          uploadDir="thumbnail"
          value={galleryImages}
          onChange={setGalleryImages}
          disabled={isLoading}
        />

        <h2 style={sectionTitle}>{EDITOR_LABELS.sectionAgency}</h2>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.agencyName}
          </label>
          <input
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            style={inputStyle}
            placeholder="운영 기획사 또는 주최"
          />
        </div>
        <SingleImageUploadField
          label={EDITOR_LABELS.agencyLogo}
          uploadDir="profile"
          imageUrl={agencyLogo}
          onImageUrlChange={setAgencyLogo}
          uploading={logoUploading}
          onUploadingChange={setLogoUploading}
          disabled={isLoading}
        />

        <h2 style={sectionTitle}>{EDITOR_LABELS.sectionSchedule}</h2>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.location}
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
            placeholder="예: 서울 강남구, 온라인"
          />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.startDate}
          </label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: AUDITION_DETAIL.benefitGridGapPx }}>
          <label
            style={{ display: 'block', marginBottom: AUDITION_DETAIL.galleryGapPx, fontSize: AUDITION_DETAIL.bodyFontPx, fontWeight: 600 }}
          >
            {EDITOR_LABELS.endDate}
          </label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>

        <h2 style={sectionTitle}>{EDITOR_LABELS.sectionLists}</h2>
        <StringListEditor label={EDITOR_LABELS.recruitFields} values={recruitFields} onChange={setRecruitFields} />
        <StringListEditor label={EDITOR_LABELS.qualifications} values={qualifications} onChange={setQualifications} />
        <StringListEditor label={EDITOR_LABELS.schedules} values={schedules} onChange={setSchedules} />

        <h2 style={sectionTitle}>{EDITOR_LABELS.sectionBenefits}</h2>
        <StringListEditor label={EDITOR_LABELS.benefits} values={benefits} onChange={setBenefits} />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ marginTop: AUDITION_DETAIL.mainGridGapPx }}>
          <button
            type="button"
            disabled={formBusy}
            onClick={() => persist('draft')}
            style={{
              height: HERO.buttonHeightPx,
              borderRadius: HERO.buttonRadiusPx,
              border: `1px solid ${SIGNUP.inputBorderColor}`,
              background: '#fff',
              color: '#374151',
              fontWeight: 600,
              padding: '0 20px',
              cursor: formBusy ? 'not-allowed' : 'pointer',
              opacity: formBusy ? 0.7 : 1,
            }}
          >
            {isLoading ? '저장 중…' : '임시 저장'}
          </button>
          <button
            type="button"
            disabled={formBusy}
            onClick={() => persist('publish')}
            style={{
              height: HERO.buttonHeightPx,
              borderRadius: HERO.buttonRadiusPx,
              border: 'none',
              background: `linear-gradient(90deg, ${HERO.primaryGradientStart}, ${HERO.primaryGradientEnd})`,
              color: '#fff',
              fontWeight: 600,
              padding: '0 20px',
              cursor: formBusy ? 'not-allowed' : 'pointer',
              opacity: formBusy ? 0.7 : 1,
            }}
          >
            {isLoading ? '처리 중…' : '등록하기'}
          </button>
          {(mode === 'edit' || !!draftId) && (
            <button
              type="button"
              disabled={formBusy}
              onClick={persistClosed}
              style={{
                height: HERO.buttonHeightPx,
                borderRadius: HERO.buttonRadiusPx,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                fontWeight: 600,
                padding: '0 20px',
                cursor: formBusy ? 'not-allowed' : 'pointer',
                opacity: formBusy ? 0.7 : 1,
              }}
            >
              마감으로 저장
            </button>
          )}
        </div>
      </form>
    </div>
  )

  const previewCol = (
    <div className="w-full lg:w-[40%] lg:sticky lg:top-4 lg:self-start">
      <AuditionEditorPreview
        title={title}
        description={description}
        tags={previewTagLabels}
        coverThumbUrl={
          images.thumb.trim() || images.medium.trim() || images.original.trim()
        }
        videoUrl={videoUrl}
        status={
          mode === 'create' && !effectiveId
            ? 'DRAFT'
            : status
        }
      />
    </div>
  )

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

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {formCol}
        {previewCol}
      </div>
    </>
  )
}
