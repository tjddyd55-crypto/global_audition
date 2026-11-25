import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SignupCountrySelect } from '../SignupCountrySelect'
import { apiClient } from '@/shared/api/client'
import messages from '../../../../messages/ko.json'

jest.mock('@/shared/api/client', () => ({ apiClient: { get: jest.fn() } }))

function Form() {
  const [country, setCountry] = useState('KR')
  return <><SignupCountrySelect id="country" label="국가" value={country} onChange={setCountry} /><output data-testid="code">{country}</output></>
}
it('clears stale countries and only submits a selected real Other-country code', async () => {
  ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [{ code: 'NP', name: '네팔', englishName: 'Nepal' }] })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><NextIntlClientProvider locale="ko" messages={messages}><Form /></NextIntlClientProvider></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('국가'), { target: { value: 'MN' } })
  expect(screen.getByTestId('code')).toHaveTextContent('MN')
  fireEvent.change(screen.getByLabelText('국가'), { target: { value: 'OTHER' } })
  expect(screen.getByTestId('code')).toBeEmptyDOMElement()
  await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/auth/countries', { params: { locale: 'ko' } }))
  fireEvent.change(screen.getByLabelText('국가명 직접 입력'), { target: { value: 'Nep' } })
  fireEvent.click(await screen.findByRole('button', { name: '네팔 (NP)' }))
  expect(screen.getByTestId('code')).toHaveTextContent('NP')
  fireEvent.change(screen.getByLabelText('국가명 직접 입력'), { target: { value: 'not a country' } })
  expect(screen.getByTestId('code')).toBeEmptyDOMElement()
  expect(screen.getByText(messages.register.countryNotFound)).toBeInTheDocument()
})
