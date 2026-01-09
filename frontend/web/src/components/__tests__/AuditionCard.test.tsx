import { render, screen } from '@testing-library/react'
import AuditionCard from '../audition/AuditionCard'
import { AuditionCategory, AuditionStatus } from '@/types'

const mockAudition = {
  id: 1,
  title: '테스트 오디션',
  status: AuditionStatus.ONGOING,
  category: AuditionCategory.SINGER,
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  businessId: 1,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
}

describe('AuditionCard', () => {
  it('should render audition title', () => {
    render(<AuditionCard audition={mockAudition} />)
    expect(screen.getByText('테스트 오디션')).toBeInTheDocument()
  })

  it('should render category label', () => {
    render(<AuditionCard audition={mockAudition} />)
    expect(screen.getByText('가수')).toBeInTheDocument()
  })

  it('should render status label', () => {
    render(<AuditionCard audition={mockAudition} />)
    expect(screen.getByText('진행중')).toBeInTheDocument()
  })
})
