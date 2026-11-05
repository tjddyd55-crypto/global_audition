import { auditionEditSource } from '../auditionEditSource'
import type { AuditionDto } from '@/shared/types/audition'

function audition(partial: Partial<AuditionDto>): AuditionDto {
  return {
    id: '1',
    ownerId: 'owner',
    title: 'English title',
    description: 'English body',
    status: 'OPEN',
    tags: ['보컬'],
    createdAt: '',
    images: { original: null, medium: null, thumb: null },
    galleryImages: [],
    agencyName: 'Agency EN',
    applicantsCount: 0,
    remainingDays: 0,
    recruitFields: ['VOCAL'],
    qualifications: [],
    schedules: [],
    location: 'Seoul EN',
    startDate: '',
    endDate: '',
    benefits: [],
    ...partial,
  }
}

describe('auditionEditSource', () => {
  it('uses original content instead of the locale overlay', () => {
    const source = auditionEditSource(audition({
      originalContent: {
        title: '원문 제목',
        description: '원문 본문',
        location: '서울',
        agencyName: '기획사',
        recruitFields: ['VOCAL'],
        qualifications: ['자격'],
        schedules: [],
        benefits: [],
      },
    }))
    expect(source.title).toBe('원문 제목')
    expect(source.description).toBe('원문 본문')
    expect(source.location).toBe('서울')
  })
})
