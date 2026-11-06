import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('sends ISO country and IANA timezone with the applicant payload', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <PcRegisterPage />
      </NextIntlClientProvider>,
    )

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'singer@example.com' } })
    fireEvent.change(screen.getByLabelText('Nickname *'), { target: { value: 'singer' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret1' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'secret1' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Country' }), { target: { value: 'MN' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Timezone' }), { target: { value: 'Asia/Ulaanbaatar' } })
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
    })
  })
})
