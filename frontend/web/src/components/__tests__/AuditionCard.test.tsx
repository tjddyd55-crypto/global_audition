import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import AuditionCard from '../audition/AuditionCard'
import type { AuditionDto } from '@/shared/types/audition'

const mockAudition: AuditionDto = {
  id: '1',
  ownerId: 'owner-1',
  title: '테스트 오디션',
  description: '테스트 설명',
  status: 'OPEN',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['보컬'],
  images: { original: null, medium: null, thumb: null },
  videoUrl: null,
  galleryImages: [],
  agencyName: '테스트 기획사',
  agencyLogo: null,
  applicantsCount: 0,
  remainingDays: 10,
  recruitFields: ['보컬'],
  qualifications: [],
  schedules: [],
  location: '서울',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  benefits: [],
}

function renderAuditionCard(audition: AuditionDto) {
  return render(
    <NextIntlClientProvider locale="ko" messages={{}}>
      <AuditionCard audition={audition} />
    </NextIntlClientProvider>,
  )
}

describe('AuditionCard', () => {
  it('should render audition title', () => {
    renderAuditionCard(mockAudition)
    expect(screen.getByText('테스트 오디션')).toBeInTheDocument()
  })

  it('should render status label', () => {
    renderAuditionCard(mockAudition)
    expect(screen.getByText(/모집중/)).toBeInTheDocument()
  })

  it('should link to audition detail page', () => {
    renderAuditionCard(mockAudition)
    expect(screen.getByRole('link').getAttribute('href')).toMatch(/\/auditions\/1$/)
  })
})
