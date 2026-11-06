import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import MobileAuditionsListPage from '../ListPage'
import mn from '../../../../../messages/mn.json'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'mn' }),
  usePathname: () => '/mn/auditions',
}))

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: () => ({
    data: { pages: [{ items: [], total: 0, page: 0, size: 10 }] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
  }),
}))

jest.mock('@/shared/audition/useAudienceCountrySelection', () => ({
  useAudienceCountrySelection: () => ({ country: 'ALL', selectCountry: jest.fn() }),
}))

describe('MobileAuditionsListPage', () => {
  it('keeps the field filter and does not add a list search box', () => {
    render(
      <NextIntlClientProvider locale="mn" messages={mn}>
        <MobileAuditionsListPage />
      </NextIntlClientProvider>,
    )
    const category = screen.getByRole('combobox', { name: mn.auditions.category })
    expect(category).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Дуу' })).toBeTruthy()
    expect((screen.getByRole('option', { name: 'Дуу' }) as HTMLOptionElement).value).toBe('VOCAL')
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
