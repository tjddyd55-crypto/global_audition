import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../../messages/en.json'
import { authApi } from '@/shared/api/auth'
import PcRegisterPage from '../RegisterPage'

jest.mock('@/i18n.config', () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/shared/api/auth', () => ({
  authApi: { signup: jest.fn() },
}))

const signup = authApi.signup as jest.Mock

describe('PcRegisterPage applicant signup', () => {
  beforeEach(() => {
    signup.mockReset()
    signup.mockResolvedValue({ token: 't', role: 'APPLICANT', userId: 'u' })
  })

  const fillBase = () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <NextIntlClientProvider locale="en" messages={en}>
        <PcRegisterPage />
      </NextIntlClientProvider>
      </QueryClientProvider>,
    )
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'singer@example.com' } })
    fireEvent.change(screen.getByLabelText('Nickname *'), { target: { value: 'singer' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret1' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secret1' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Country' }), { target: { value: 'MN' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Timezone' }), { target: { value: 'Asia/Ulaanbaatar' } })
  }

  it('blocks signup until birth date and the required consents are given', async () => {
    fillBase()
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(await screen.findByText(en.consent.birthDateRequired)).toBeTruthy()
    fireEvent.change(document.getElementById('birthDate')!, { target: { value: '2010-05-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(await screen.findByText(en.consent.required)).toBeTruthy()
    expect(signup).not.toHaveBeenCalled()
  })

  it('sends ISO country, IANA timezone, birth date and separated consents with the applicant payload', async () => {
    fillBase()
    fireEvent.change(document.getElementById('birthDate')!, { target: { value: '2010-05-01' } })
    fireEvent.click(screen.getByTestId('consent-terms'))
    fireEvent.click(screen.getByTestId('consent-privacyCollection'))
    fireEvent.click(screen.getByTestId('consent-privacyDisclosure'))
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => expect(signup).toHaveBeenCalled())
    expect(signup.mock.calls[0][0]).toEqual({
      email: 'singer@example.com',
      password: 'secret1',
      role: 'APPLICANT',
      nickname: 'singer',
      name: undefined,
      countryCode: 'MN',
      timezone: 'Asia/Ulaanbaatar',
      birthDate: '2010-05-01',
      gender: undefined,
      agreeTerms: true,
      agreePrivacyCollection: true,
      agreePrivacyDisclosure: true,
      agreeMarketing: false,
    })
  })
})
