'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { authApi } from '@/shared/api/auth'
import { RecoveryCodeNotice } from '@/components/auth/RecoveryCodeNotice'
import { countries, languages, timezones } from '@/shared/utils/countries'
import { createNicknameZodField } from '@/shared/user/nicknameZod'
import { useTranslations } from 'next-intl'

function createMobileRegisterSchema(
  tReg: (key: string) => string,
  tVal: (key: string) => string,
  tAuth: (key: string) => string,
) {
  const nickname = createNicknameZodField({
    required: tAuth('nameRequired'),
    length: tAuth('nicknameLen'),
    charset: tAuth('nicknameCharset'),
  })
  const applicantSchema = z.object({
    email: z.string().email(tReg('emailInvalid')),
    password: z.string().min(6, tReg('passwordMin6')),
    nickname,
    name: z.string().max(120).optional().or(z.literal('')),
    userType: z.literal('APPLICANT'),
    country: z.string().length(2, tVal('countryRequired')),
    city: z.string().min(1, tVal('cityRequired')),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, tVal('birthdayFormat')),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
    languages: z.array(z.string()).optional(),
    gender: z.string().optional(),
  })
  const businessSchema = z.object({
    email: z.string().email(tReg('emailInvalid')),
    password: z.string().min(6, tReg('passwordMin6')),
    nickname,
    name: z.string().max(120).optional().or(z.literal('')),
    userType: z.literal('BUSINESS'),
    businessCountry: z.string().length(2, tVal('countryRequired')),
    businessCity: z.string().min(1, tVal('cityRequired')),
    companyName: z.string().min(1, tVal('companyNameRequired')),
    legalName: z.string().min(1, tVal('legalNameRequired')),
    representativeName: z.string().min(1, tVal('representativeNameRequired')),
    businessRegistrationNumber: z.string().min(1, tVal('businessRegistrationNumberRequired')),
    businessLicenseDocumentUrl: z.string().optional(),
    taxId: z.string().optional(),
    businessAddress: z.string().optional(),
    website: z.string().url(tVal('urlInvalid')).optional().or(z.literal('')),
    contactEmail: z.string().email(tReg('emailInvalid')).optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  })
  return z.discriminatedUnion('userType', [applicantSchema, businessSchema])
}

type RegisterFormData = z.infer<ReturnType<typeof createMobileRegisterSchema>>

export default function MobileRegisterPage() {
  const tAuth = useTranslations('auth')
  const tReg = useTranslations('register')
  const tVal = useTranslations('validation')
  const tCountries = useTranslations('countries')
  const tLanguages = useTranslations('languages')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [issuedCode, setIssuedCode] = useState<string | null>(null)
  const [issuedRole, setIssuedRole] = useState<string>('APPLICANT')
  const registerSchema = useMemo(() => createMobileRegisterSchema(tReg, tVal, tAuth), [tAuth, tReg, tVal])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'APPLICANT',
    },
  })

  const userType = watch('userType')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      let submitData: any = { ...data }

      if ('confirmPassword' in submitData) {
        delete submitData.confirmPassword
      }

      if (userType === 'APPLICANT') {
        if (!submitData.country || submitData.country.trim() === '') {
          setError(tVal('countryRequired'))
          setIsLoading(false)
          return
        }

        submitData.country = (submitData.country ?? '').trim().toUpperCase()

        if (!/^[A-Z]{2}$/.test(submitData.country)) {
          setError(tAuth('countryCodeHint'))
          setIsLoading(false)
          return
        }

        if (!submitData.city || submitData.city.trim() === '') {
          setError(tVal('cityRequired'))
          setIsLoading(false)
          return
        }

        submitData.city = (submitData.city ?? '').trim()

        if (!submitData.birthday) {
          setError(tVal('birthdayRequired'))
          setIsLoading(false)
          return
        }

        let birthdayStr: string

        if (typeof submitData.birthday === 'string') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!dateRegex.test(submitData.birthday)) {
            setError(tAuth('birthdayIso'))
            setIsLoading(false)
            return
          }
          birthdayStr = submitData.birthday
        } else if (submitData.birthday instanceof Date) {
          const year = submitData.birthday.getFullYear()
          const month = String(submitData.birthday.getMonth() + 1).padStart(2, '0')
          const day = String(submitData.birthday.getDate()).padStart(2, '0')
          birthdayStr = `${year}-${month}-${day}`
        } else {
          setError(tVal('birthdayFormat'))
          setIsLoading(false)
          return
        }

        submitData.birthday = birthdayStr

        if (selectedLanguages.length > 0) {
          submitData.languages = selectedLanguages
        }
      }

      if (userType === 'BUSINESS') {
        if ('username' in submitData) {
          submitData.email = submitData.username
          delete submitData.username
        }

        if (submitData.businessCountry) {
          submitData.businessCountry = submitData.businessCountry.trim().toUpperCase()

          if (!/^[A-Z]{2}$/.test(submitData.businessCountry)) {
            setError(tAuth('countryCodeHint'))
            setIsLoading(false)
            return
          }
        }

        if (submitData.businessCity) {
          submitData.businessCity = (submitData.businessCity ?? '').trim()
        }

        if (submitData.companyName) {
          submitData.companyName = (submitData.companyName ?? '').trim()
        }
      }

      const response = await authApi.signup({
        email: submitData.email,
        password: submitData.password,
        role: submitData.userType === 'BUSINESS' ? 'AGENCY' : 'APPLICANT',
        nickname: submitData.nickname.trim(),
        name: submitData.name?.trim() ? submitData.name.trim() : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      if (response.recoveryCode) {
        setIssuedRole(response.role)
        setIssuedCode(response.recoveryCode)
        return
      }
      if (response.role === 'AGENCY') {
        window.location.href = '/my/dashboard'
      } else {
        window.location.href = '/'
      }
    } catch (err: any) {
      console.error('signup failed', err)
      console.error('signup response', err.response?.data)
      console.error('signup status', err.response?.status)

      let errorMessage = tAuth('registerError')

      if (err.response?.data) {
        const errorData = err.response.data

        if (errorData.errors && typeof errorData.errors === 'object') {
          const fieldErrors = Object.values(errorData.errors) as string[]
          errorMessage = fieldErrors.join(', ')
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.exceptionMessage) {
          errorMessage = errorData.exceptionMessage
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode) ? prev.filter((l) => l !== langCode) : [...prev, langCode]
    )
  }

  if (issuedCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <RecoveryCodeNotice
            recoveryCode={issuedCode}
            onAcknowledged={() => {
              if (issuedRole === 'AGENCY') window.location.href = '/my/dashboard'
              else window.location.href = '/'
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">{tAuth('registerTitle')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('email')} *</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('password')} *</label>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tAuth('passwordMin6')}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('nickname')} *</label>
            <input
              type="text"
              {...register('nickname')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tAuth('displayNamePlaceholder')}
            />
            {'nickname' in errors && errors.nickname && (
              <p className="text-red-500 text-sm mt-1">{errors.nickname.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('legalNameOptional')}</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tAuth('legalNamePlaceholder')}
            />
            {'name' in errors && errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('userType')} *</label>
            <select
              {...register('userType')}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="APPLICANT">{tAuth('applicant')}</option>
              <option value="BUSINESS">{tAuth('business')}</option>
            </select>
          </div>

          {userType === 'APPLICANT' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{tReg('country')} *</label>
                <select
                  {...register('country')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{tReg('selectCountry')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {tCountries(country.code)}
                    </option>
                  ))}
                </select>
                {'country' in errors && errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('city')} *</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('enterCity')}
                />
                {'city' in errors && errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('birthday')} *</label>
                <input
                  type="date"
                  {...register('birthday')}
                  className="w-full px-4 py-2 border rounded-lg"
                  max={new Date().toISOString().split('T')[0]}
                />
                {'birthday' in errors && errors.birthday && (
                  <p className="text-red-500 text-sm mt-1">{errors.birthday.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('phone')}</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('phoneOptional')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('address')}</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('addressOptional')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('timezone')}</label>
                <select
                  {...register('timezone')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{tReg('selectTimezone')}</option>
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('languages')}</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {languages.map((lang) => (
                    <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.code)}
                        onChange={() => toggleLanguage(lang.code)}
                        className="rounded"
                      />
                      <span>{tLanguages(lang.code)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('gender')}</label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{tAuth('selectOptional')}</option>
                  <option value="MALE">{tReg('male')}</option>
                  <option value="FEMALE">{tReg('female')}</option>
                  <option value="OTHER">{tReg('other')}</option>
                </select>
              </div>
            </>
          )}

          {userType === 'BUSINESS' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{tReg('country')} *</label>
                <select
                  {...register('businessCountry')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{tReg('selectCountry')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {tCountries(country.code)}
                    </option>
                  ))}
                </select>
                {'businessCountry' in errors && errors.businessCountry && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessCountry.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('city')} *</label>
                <input
                  type="text"
                  {...register('businessCity')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('enterCity')}
                />
                {'businessCity' in errors && errors.businessCity && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessCity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('companyName')} *</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('companyName')}
                />
                {'companyName' in errors && errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('legalName')} *</label>
                <input
                  type="text"
                  {...register('legalName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('legalNameOfficial')}
                />
                {'legalName' in errors && errors.legalName && (
                  <p className="text-red-500 text-sm mt-1">{errors.legalName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('representativeName')} *</label>
                <input
                  type="text"
                  {...register('representativeName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('representativeName')}
                />
                {'representativeName' in errors && errors.representativeName && (
                  <p className="text-red-500 text-sm mt-1">{errors.representativeName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('businessRegistrationNumber')} *</label>
                <input
                  type="text"
                  {...register('businessRegistrationNumber')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('businessRegistrationNumber')}
                />
                {'businessRegistrationNumber' in errors && errors.businessRegistrationNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessRegistrationNumber.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {tReg('registrationFormat')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('businessLicense')}</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(_e) => {
                    /* TODO: 파일 업로드 구현 */
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {tReg('uploadLicense')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('taxId')}</label>
                <input
                  type="text"
                  {...register('taxId')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('taxIdOptional')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('address')}</label>
                <input
                  type="text"
                  {...register('businessAddress')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('companyAddressOptional')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('website')}</label>
                <input
                  type="url"
                  {...register('website')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('websiteOptional')}
                />
                {'website' in errors && errors.website && (
                  <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('contactEmail')}</label>
                <input
                  type="email"
                  {...register('contactEmail')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('contactEmail')}
                />
                {'contactEmail' in errors && errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('contactPhone')}</label>
                <input
                  type="tel"
                  {...register('contactPhone')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('phoneOptional')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tReg('establishedYear')}</label>
                <input
                  type="number"
                  {...register('establishedYear', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={tReg('establishedOptional')}
                  min={1800}
                  max={new Date().getFullYear()}
                />
                {'establishedYear' in errors && errors.establishedYear && (
                  <p className="text-red-500 text-sm mt-1">{errors.establishedYear.message}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? tAuth('signingUp') : tAuth('registerButton')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {tAuth('alreadyHaveAccount')}{' '}
            <a href="/login" className="text-primary-600 hover:underline">
              {tAuth('loginButton')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
