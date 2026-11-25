'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { apiClient } from '@/shared/api/client'
import { COUNTRY_CODES } from '@/shared/utils/countries'
import { matchingSignupCountries, type SignupCountry } from '@/shared/auth/signupCountries'

export function SignupCountrySelect({ id, name, label, value, onChange }: { id: string; name?: string; label: string; value: string; onChange: (code: string) => void }) {
  const t = useTranslations('register')
  const tc = useTranslations('countries')
  const common = useTranslations('common')
  const locale = useLocale()
  const [other, setOther] = useState(false)
  const [query, setQuery] = useState('')
  const countries = useQuery({ queryKey: ['signup-countries', locale], queryFn: async () => (await apiClient.get<SignupCountry[]>('/auth/countries', { params: { locale } })).data, enabled: other || Boolean(value && !COUNTRY_CODES.includes(value as typeof COUNTRY_CODES[number])), staleTime: Infinity })
  const options = countries.data ?? []
  const matches = matchingSignupCountries(options, query)
  const selected = options.find((country) => country.code === value)
  const custom = other || Boolean(value && !COUNTRY_CODES.includes(value as typeof COUNTRY_CODES[number]))
  const input = 'min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-6'
  return <div className="space-y-2">
    <select id={id} name={name} aria-label={label} value={custom ? 'OTHER' : value} className={input} onChange={(event) => {
      const code = event.target.value
      setOther(code === 'OTHER'); setQuery(''); onChange(code === 'OTHER' ? '' : code)
    }}>
      <option value="">{t('selectCountry')}</option>
      {COUNTRY_CODES.map((code) => <option key={code} value={code}>{tc(code)}</option>)}
      <option value="OTHER">{t('otherCountry')}</option>
    </select>
    {custom ? <div className="space-y-2">
      <label htmlFor={`${id}-other`} className="block text-sm font-medium">{t('otherCountryName')}</label>
      <input id={`${id}-other`} value={query} className={input} autoComplete="off" placeholder={t('countrySearchPlaceholder')} onChange={(event) => {
        const text = event.target.value; setQuery(text)
        const exact = options.find((country) => [country.code, country.name, country.englishName].some((name) => name.toLocaleLowerCase() === text.trim().toLocaleLowerCase()))
        onChange(exact?.code ?? '')
      }} />
      {countries.isLoading ? <p className="text-sm">{common('loading')}</p> : countries.isError ? <button type="button" className={input} onClick={() => void countries.refetch()}>{common('retry')}</button> : null}
      {!selected && matches.slice(0, 8).map((country) => <button type="button" key={country.code} className={`${input} text-left`} onClick={() => { setQuery(country.name); onChange(country.code) }}>{country.name} ({country.code})</button>)}
      <p className="text-sm leading-6 text-gray-600" aria-live="polite">{selected ? `${selected.name} (${selected.code})` : query && !countries.isLoading && !countries.isError && matches.length === 0 ? t('countryNotFound') : t('countryChooseResult')}</p>
    </div> : null}
  </div>
}
