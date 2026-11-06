import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../messages/en.json'
import AuditionList from '../AuditionList'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en/auditions',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/i18n.config', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      {
        id: '1',
        ownerId: 'owner-1',
        title: 'Open call',
        description: '',
        status: 'OPEN',
        createdAt: '2026-01-01T00:00:00.000Z',
        tags: [],
        images: { original: null, medium: null, thumb: null },
        galleryImages: [],
        agencyName: 'Agency',
        applicantsCount: 0,
        remainingDays: 3,
        recruitFields: [],
        qualifications: [],
        schedules: [],
        location: 'Seoul',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        benefits: [],
      },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}))

jest.mock('@/shared/audition/useAudienceCountrySelection', () => ({
  useAudienceCountrySelection: () => ({ country: 'ALL', selectCountry: jest.fn() }),
}))

describe('AuditionList narrow layout', () => {
  it('pads the country guide, keeps one column, and hides search below sm', () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AuditionList />
      </NextIntlClientProvider>,
    )

    const guide = screen.getByTestId('audition-country-guide')
    expect(guide.className).toContain('px-4')
    expect(guide).toHaveTextContent(en.auditions.filterHint)

    const search = screen.getByPlaceholderText(en.auditions.search)
    expect(search.className).toContain('hidden')
    expect(search.className).toContain('sm:block')

    const results = screen.getByTestId('audition-list-results')
    expect(results.className).toContain('flex-col')
    expect(results.className).not.toContain('grid-cols-2')
  })
})
