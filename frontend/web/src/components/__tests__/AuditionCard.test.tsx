import { render, screen } from '@testing-library/react'
import AuditionCard from '../audition/AuditionCard'
import type { AuditionResponse } from '../../lib/api/auditions'

const mockAudition: AuditionResponse = {
  id: '1',
  ownerId: 'owner-1',
  title: '테스트 오디션',
  description: '테스트 설명',
  status: 'OPEN',
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
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
