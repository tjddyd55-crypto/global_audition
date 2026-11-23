import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider
        locale="ko"
        messages={{
          status: { open: '모집중', closed: '마감', draft: '초안', roundOpen: '{n}차 모집 중', roundClosed: '{n}차 마감', roundDraft: '{n}차 · 초안' },
          fallback: { videoTitle: '제목 없음', date: '날짜 없음' },
          common: { close: '닫기' },
          savedAuditions: {
            save: '관심 저장',
            unsave: '관심 해제',
            saveAria: '관심 오디션으로 저장',
            unsaveAria: '관심 오디션에서 제거',
            loginRequired: '로그인해 주세요.',
            loginAction: '로그인',
            toggleFailed: '실패',
          },
        }}
      >
        <AuditionCard audition={audition} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  )
}

describe('AuditionCard', () => {
  it('should render audition title', () => {
    renderAuditionCard(mockAudition)
    expect(screen.getByText('테스트 오디션')).toBeInTheDocument()
  })

  it('should render status label', () => {
    renderAuditionCard(mockAudition)
    expect(screen.getByText(/1차 모집 중/)).toBeInTheDocument()
  })

  it('should link to audition detail page', () => {
    renderAuditionCard(mockAudition)
    expect(screen.getByRole('link').getAttribute('href')).toMatch(/\/auditions\/1$/)
  })
})
