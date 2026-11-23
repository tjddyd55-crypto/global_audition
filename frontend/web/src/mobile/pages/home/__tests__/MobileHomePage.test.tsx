import { devAuditionThumbnail } from '../devAssets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ko from '../../../../../messages/ko.json'
import type { AuditionDto } from '@/shared/types/audition'
import MobileHomePage from '../HomePage'
import { useAuditionsListQuery } from '@/components/audition/useAuditionsListQuery'
import { auditionRecommendationsApi } from '@/shared/api/auditionRecommendations'
import { channelApi } from '@/shared/api/channel'

jest.mock('@/components/audition/useAuditionsListQuery', () => ({
  useAuditionsListQuery: jest.fn(),
}))

jest.mock('@/shared/api/auditionRecommendations', () => {
  const actual = jest.requireActual('@/shared/api/auditionRecommendations')
  return {
    ...actual,
    auditionRecommendationsApi: {
      list: jest.fn(),
      closingSoon: jest.fn(),
    },
  }
})

jest.mock('@/shared/api/channel', () => {
  const actual = jest.requireActual('@/shared/api/channel')
  return {
    ...actual,
    channelApi: {
      ...actual.channelApi,
      listPublic: jest.fn(),
    },
  }
})

const mockedQuery = useAuditionsListQuery as jest.Mock
const mockedList = auditionRecommendationsApi.list as jest.Mock
const mockedClosing = auditionRecommendationsApi.closingSoon as jest.Mock
const mockedChannels = channelApi.listPublic as jest.Mock

const REAL = 'https://cdn.example.com/real-thumb.jpg'

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

function allAuditions() {
  return [1, 2, 3, 4, 5, 6].map((n) => {
    const a = audition(`a${n}`, `오디션${n}`)
    return n === 2 ? { ...a, images: { original: REAL, medium: REAL, thumb: REAL } } : a
  })
}

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="ko" messages={ko}>
        <MobileHomePage />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  )
}

describe('MobileHomePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockedQuery.mockReset()
    mockedList.mockReset()
    mockedClosing.mockReset()
    mockedChannels.mockReset()
    const rows = allAuditions()
    mockedQuery.mockReturnValue({ data: rows, isLoading: false })
    mockedList.mockResolvedValue({
      items: rows.slice(0, 3).map((row) => ({
        audition: row,
        reasons: ['FIELD_MATCH'],
        eligibility: 'ELIGIBLE',
        score: 40,
      })),
      fallback: false,
      personalized: false,
    })
    mockedClosing.mockResolvedValue([])
    mockedChannels.mockResolvedValue([
      {
        userId: 'c1',
        nickname: '채널1',
        profileImage: null,
        introText: null,
        subscriberCount: 0,
        videoCount: 0,
        nationality: 'KR',
        mainField: 'VOCAL',
        featuredThumbnailUrl: null,
      },
    ])
  })

  it('renders compact brand banner, country tiles and content sections', async () => {
    renderHome()
    expect(screen.getByText('GLOBAL AUDITION')).toBeInTheDocument()
    expect(screen.getByText('나에게 맞는 오디션을 찾고 저장하세요')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('link', { name: '가입' })).toBeNull()
    for (const name of ['한국', '몽골', '일본', '기타']) expect(screen.getByText(name)).toBeInTheDocument()

    const recommended = await waitFor(() => within(screen.getByTestId('mobile-recommended')).getAllByTestId('mobile-audition-card'))
    expect(recommended).toHaveLength(3)
    expect(recommended[0].getAttribute('href')).toMatch(/\/auditions\/a1$/)
    expect(recommended[0].querySelector('img')?.getAttribute('src')).toBe(devAuditionThumbnail('a1'))
    expect(recommended[1].querySelector('img')?.getAttribute('src')).toBe(REAL)
    expect(within(recommended[0]).getByText('오디션1 기획사')).toBeInTheDocument()
    expect(within(recommended[0]).getByText('2026.09.01 ~ 2026.10.31')).toBeInTheDocument()
    expect(within(recommended[0]).getByText('관심 분야와 일치')).toBeInTheDocument()

    const latest = within(screen.getByTestId('mobile-latest')).getAllByTestId('mobile-audition-card')
    expect(latest).toHaveLength(3)
    expect(latest[0].getAttribute('href')).toMatch(/\/auditions\/a4$/)

    expect(screen.getByTestId('home-channel-card').getAttribute('href')).toMatch(/\/channel\/c1$/)
    expect(screen.getByText('채널1')).toBeInTheDocument()
  })

  it('country tile drives the audition country filter, not the UI language', async () => {
    renderHome()
    await waitFor(() => expect(mockedList).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('country-tile-MN'))
    expect(mockedQuery).toHaveBeenLastCalledWith('MN')
    expect(window.localStorage.getItem('audition.audienceCountry')).toBe('MN')
    expect(screen.getByTestId('country-tile-MN').getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByTestId('country-tile-MN'))
    expect(mockedQuery).toHaveBeenLastCalledWith('ALL')
  })
})
