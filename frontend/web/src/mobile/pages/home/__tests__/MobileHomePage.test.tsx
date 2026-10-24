import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ko from '../../../../../messages/ko.json'
import type { AuditionDto } from '@/shared/types/audition'
import MobileHomePage from '../HomePage'
import { useAuditionsListQuery } from '@/components/audition/useAuditionsListQuery'

jest.mock('@/components/audition/useAuditionsListQuery', () => ({
  useAuditionsListQuery: jest.fn(),
}))

const mockedQuery = useAuditionsListQuery as jest.Mock

function audition(id: string, title: string): AuditionDto {
  return {
    id,
    ownerId: 'o',
    title,
    description: '',
    status: 'OPEN',
    createdAt: '2026-09-01T00:00:00.000Z',
    tags: [],
    images: { original: null, medium: null, thumb: null },
    galleryImages: [],
    agencyName: `${title} 기획사`,
    applicantsCount: 0,
    remainingDays: 3,
    recruitFields: [],
    qualifications: [],
    schedules: [],
    location: 'Seoul',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    benefits: [],
  }
}

function renderHome() {
  return render(
    <NextIntlClientProvider locale="ko" messages={ko}>
      <MobileHomePage />
    </NextIntlClientProvider>,
  )
}

describe('MobileHomePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockedQuery.mockReset()
    mockedQuery.mockReturnValue({
      data: [1, 2, 3, 4, 5, 6].map((n) => audition(`a${n}`, `오디션${n}`)),
      isLoading: false,
    })
  })

  it('renders hero, country tiles and one-column cards without search or signup', () => {
    renderHome()
    expect(screen.getByText('꿈을 펼칠 무대')).toBeInTheDocument()
    expect(screen.getByText('전 세계 기획사 오디션')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '오디션 보기' }).getAttribute('href')).toMatch(/\/auditions$/)
    expect(screen.getByRole('link', { name: '채널' }).getAttribute('href')).toMatch(/\/channels$/)
    for (const name of ['한국', '몽골', '일본', '기타']) expect(screen.getByText(name)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('link', { name: '가입' })).toBeNull()

    const recruiting = within(screen.getByTestId('mobile-recruiting')).getAllByTestId('mobile-audition-card')
    const recommended = within(screen.getByTestId('mobile-recommended')).getAllByTestId('mobile-audition-card')
    expect(recruiting).toHaveLength(3)
    expect(recommended).toHaveLength(3)
    expect(recruiting[0].getAttribute('href')).toMatch(/\/auditions\/a1$/)
    expect(recommended[0].getAttribute('href')).toMatch(/\/auditions\/a4$/)
    expect(within(recruiting[0]).getByText('오디션1 기획사')).toBeInTheDocument()
    expect(within(recruiting[0]).getByText('2026.09.01 ~ 2026.10.31')).toBeInTheDocument()
  })

  it('country tile drives the audition country filter, not the UI language', () => {
    renderHome()
    fireEvent.click(screen.getByTestId('country-tile-MN'))
    expect(mockedQuery).toHaveBeenLastCalledWith('MN')
    expect(window.localStorage.getItem('audition.audienceCountry')).toBe('MN')
    expect(screen.getByTestId('country-tile-MN').getAttribute('aria-pressed')).toBe('true')
    // 다시 누르면 전체로 돌아간다
    fireEvent.click(screen.getByTestId('country-tile-MN'))
    expect(mockedQuery).toHaveBeenLastCalledWith('ALL')
  })
})
