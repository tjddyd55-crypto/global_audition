import { render, screen } from '@testing-library/react'
import AuditionCard from '../audition/AuditionCard'
import type { AuditionDto } from '../../lib/types/audition'
import { emptyDetailContent } from '../../lib/types/audition'

const mockAudition: AuditionDto = {
  id: '1',
  ownerId: 'owner-1',
  title: '테스트 오디션',
  description: '테스트 설명',
  status: 'OPEN',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  category: 'K-POP',
  coverImage: null,
  videoUrl: null,
  galleryImages: [],
  agencyName: '테스트 기획사',
  agencyLogo: null,
  applicantsCount: 0,
  remainingDays: 10,
  recruitFields: ['보컬'],
  location: '서울',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  detailContent: emptyDetailContent(),
  benefits: [],
}

describe('AuditionCard', () => {
  it('should render audition title', () => {
    render(<AuditionCard audition={mockAudition} />)
    expect(screen.getByText('테스트 오디션')).toBeInTheDocument()
  })

  it('should render status label', () => {
    render(<AuditionCard audition={mockAudition} />)
    expect(screen.getByText('모집중')).toBeInTheDocument()
  })

  it('should link to audition detail page', () => {
    render(<AuditionCard audition={mockAudition} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auditions/1')
  })
})
