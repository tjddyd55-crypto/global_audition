import type { AuditionDto, AuditionTextContent } from '@/shared/types/audition'

/** 편집 폼은 표시용 번역이 아니라 저장된 원문만 읽는다. */
export function auditionEditSource(audition: AuditionDto): AuditionTextContent {
  const original = audition.originalContent
  if (original) return original
  return {
    title: audition.title ?? '',
    description: audition.description ?? '',
    location: audition.location ?? '',
    agencyName: audition.agencyName ?? '',
    recruitFields: [...(audition.recruitFields ?? [])],
    qualifications: [...(audition.qualifications ?? [])],
    schedules: [...(audition.schedules ?? [])],
    benefits: [...(audition.benefits ?? [])],
  }
}
