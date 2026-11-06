import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { ProfileManageForm } from '../ProfileManageForm'
import { meProfileApi } from '@/shared/api/meProfile'
import ko from '../../../../messages/ko.json'
import mn from '../../../../messages/mn.json'

jest.mock('@/shared/api/meProfile', () => ({
  meProfileApi: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

const getProfile = meProfileApi.get as jest.Mock
const patchProfile = meProfileApi.patch as jest.Mock

function renderForm(locale: 'ko' | 'mn', messages: typeof ko) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ProfileManageForm />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  )
}

describe('ProfileManageForm residence fields', () => {
  beforeEach(() => {
    getProfile.mockReset()
    patchProfile.mockReset()
    patchProfile.mockResolvedValue({})
    getProfile.mockResolvedValue({
      email: 'singer@example.com',
      name: 'Sara',
      nickname: 'sara',
      nationality: 'KR',
      countryCode: 'MN',
      timezone: 'Asia/Ulaanbaatar',
      introText: '',
      snsLinks: [],
    })
  })

  it('shows a translated residence country separately from nationality and saves the code', async () => {
    renderForm('mn', mn)
    const residence = await screen.findByRole('combobox', { name: 'Оршин суугаа улс' })
    expect(within(residence).getByRole('option', { name: 'Монгол' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Иргэншил' })).toHaveValue('KR')
    expect(residence).toHaveValue('MN')
    expect(screen.getByRole('combobox', { name: 'Цагийн бүс' })).toHaveValue('Asia/Ulaanbaatar')

    fireEvent.change(residence, { target: { value: 'JP' } })
    fireEvent.click(screen.getByRole('button', { name: 'Хадгалах' }))

    await waitFor(() => expect(patchProfile).toHaveBeenCalled())
    const body = patchProfile.mock.calls[0][0]
    expect(body.countryCode).toBe('JP')
    expect(body.timezone).toBe('Asia/Ulaanbaatar')
    expect(body.nationality).toBe('KR')
  })

  it('keeps the Korean residence label distinct from nationality', async () => {
    renderForm('ko', ko)
    const residence = await screen.findByRole('combobox', { name: '거주 국가' })
    expect(residence).toHaveValue('MN')
    expect(screen.getByRole('combobox', { name: '국적' })).toHaveValue('KR')
    expect(within(residence).getByRole('option', { name: '몽골 (Mongolia)' })).toBeTruthy()
  })
})
