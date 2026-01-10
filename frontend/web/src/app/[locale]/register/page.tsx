'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api/auth'
import { countries, languages, timezones } from '@/lib/utils/countries'
import { useTranslations } from 'next-intl'

// 지망생 스키마 (refine 제거 - discriminatedUnion 전에는 ZodObject 타입이어야 함)
const applicantSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirmPassword: z.string().min(8, '비밀번호 확인은 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  userType: z.literal('APPLICANT'),
  country: z.string().length(2, '국가를 선택해주세요'),
  city: z.string().min(1, '도시를 입력해주세요'),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  gender: z.string().optional(),
})

// 기획사 스키마 (refine 제거 - discriminatedUnion 전에는 ZodObject 타입이어야 함)
const businessSchema = z.object({
  username: z.string().min(3, '아이디는 최소 3자 이상이어야 합니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirmPassword: z.string().min(8, '비밀번호 확인은 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  userType: z.literal('BUSINESS'),
  businessCountry: z.string().length(2, '국가를 선택해주세요'),
  businessCity: z.string().min(1, '도시를 입력해주세요'),
  companyName: z.string().min(1, '회사명을 입력해주세요'),
  businessRegistrationNumber: z.string().min(1, '사업자 등록번호를 입력해주세요'),
  businessLicenseDocumentUrl: z.string().optional(),
  taxId: z.string().optional(),
  businessAddress: z.string().optional(),
  website: z.string().url('유효한 URL을 입력해주세요').optional().or(z.literal('')),
  contactEmail: z.string().email('유효한 이메일을 입력해주세요').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
})

// discriminatedUnion 후에 superRefine으로 비밀번호 확인 검증 추가
const registerSchemaBase = z.discriminatedUnion('userType', [applicantSchema, businessSchema])

const registerSchema = registerSchemaBase.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '비밀번호가 일치하지 않습니다',
      path: ['confirmPassword'],
    })
  }
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('register')
  const tAuth = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      
      // confirmPassword 필드 제거
      if ('confirmPassword' in submitData) {
        delete submitData.confirmPassword
      }
      
      // 지망생인 경우 필수 필드 확인 및 birthday 형식 보장
      if (userType === 'APPLICANT') {
        // 필수 필드 확인
        if (!submitData.country || submitData.country.trim() === '') {
          setError('국가를 선택해주세요')
          setIsLoading(false)
          return
        }
        
        // country 코드를 대문자로 변환 (ISO 3166-1 alpha-2 형식)
        submitData.country = submitData.country.trim().toUpperCase()
        
        // country 형식 검증 (2자 대문자)
        if (!/^[A-Z]{2}$/.test(submitData.country)) {
          setError('국가는 2자리 대문자 코드여야 합니다 (예: KR, US, JP)')
          setIsLoading(false)
          return
        }
        
        if (!submitData.city || submitData.city.trim() === '') {
          setError('도시를 입력해주세요')
          setIsLoading(false)
          return
        }
        
        // city 공백 제거
        submitData.city = submitData.city.trim()
        
        if (!submitData.birthday) {
          setError('생년월일을 입력해주세요')
          setIsLoading(false)
          return
        }
        
        // birthday를 문자열로 변환 (HTML date input은 문자열 반환)
        let birthdayStr: string
        
        if (typeof submitData.birthday === 'string') {
          // 이미 문자열인 경우 형식 검증
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!dateRegex.test(submitData.birthday)) {
            setError('생년월일은 YYYY-MM-DD 형식이어야 합니다 (예: 2000-01-01)')
            setIsLoading(false)
            return
          }
          birthdayStr = submitData.birthday
        } else if (submitData.birthday instanceof Date) {
          // Date 객체인 경우 문자열로 변환
          const year = submitData.birthday.getFullYear()
          const month = String(submitData.birthday.getMonth() + 1).padStart(2, '0')
          const day = String(submitData.birthday.getDate()).padStart(2, '0')
          birthdayStr = `${year}-${month}-${day}`
        } else {
          setError('생년월일 형식이 올바르지 않습니다')
          setIsLoading(false)
          return
        }
        
        submitData.birthday = birthdayStr
        
        // 언어 배열 처리
        if (selectedLanguages.length > 0) {
          submitData.languages = selectedLanguages
        }
      }
      
      // 기획사인 경우 username을 email로 매핑 및 country 형식 변환
      if (userType === 'BUSINESS') {
        if ('username' in submitData) {
          submitData.email = submitData.username
          delete submitData.username
        }
        
        // businessCountry 코드를 대문자로 변환
        if (submitData.businessCountry) {
          submitData.businessCountry = submitData.businessCountry.trim().toUpperCase()
          
          // businessCountry 형식 검증 (2자 대문자)
          if (!/^[A-Z]{2}$/.test(submitData.businessCountry)) {
            setError('국가는 2자리 대문자 코드여야 합니다 (예: KR, US, JP)')
            setIsLoading(false)
            return
          }
        }
        
        // businessCity 공백 제거
        if (submitData.businessCity) {
          submitData.businessCity = submitData.businessCity.trim()
        }
        
        // companyName 공백 제거
        if (submitData.companyName) {
          submitData.companyName = submitData.companyName.trim()
        }
      }
      
      // 디버깅: 전송 데이터 확인
      console.log('회원가입 요청 데이터 (JSON):', JSON.stringify(submitData, null, 2))
      console.log('birthday 타입:', typeof submitData.birthday)
      console.log('birthday 값:', submitData.birthday)
      
      await authApi.register(submitData)
      router.push('/login')
    } catch (err: any) {
      console.error('회원가입 오류:', err)
      console.error('오류 응답:', err.response?.data)
      console.error('오류 상태 코드:', err.response?.status)
      
      // 백엔드에서 보낸 상세 오류 메시지 추출
      let errorMessage = tAuth('registerError')
      
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Spring Validation 오류 메시지 처리
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">{t('title')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* SNS 가입 버튼 */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google로 시작하기
            </button>
            <button
              type="button"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-3 bg-[#03C75A] text-white border-[#03C75A]"
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버로 시작하기
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
          </div>

          {/* 유형 선택 버튼 */}
          <div>
            <label className="block text-sm font-medium mb-3">{tAuth('userType')} *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue('userType', 'APPLICANT')
                }}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  userType === 'APPLICANT'
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {tAuth('applicant')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('userType', 'BUSINESS')
                }}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  userType === 'BUSINESS'
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {tAuth('business')}
              </button>
            </div>
          </div>

          {/* 공통 필드 */}
          {userType === 'APPLICANT' ? (
            <div>
              <label className="block text-sm font-medium mb-2">{tAuth('email')} *</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="email@example.com"
              />
              {'email' in errors && errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">아이디 *</label>
              <input
                type="text"
                {...register('username')}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="아이디를 입력하세요"
              />
              {'username' in errors && errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('password')} *</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tAuth('password')}
            />
            {'password' in errors && errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호 확인 *</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="비밀번호를 다시 입력하세요"
            />
            {'confirmPassword' in errors && errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('name')} *</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tAuth('name')}
            />
            {'name' in errors && errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* 지망생 전용 필드 */}
          {userType === 'APPLICANT' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{t('country')} *</label>
                <select
                  {...register('country')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{t('selectCountry')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {'country' in errors && errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('city')} *</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('enterCity')}
                />
                {'city' in errors && errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('birthday')} *</label>
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
                <label className="block text-sm font-medium mb-2">{t('phone')}</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('address')}</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('address')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('timezone')}</label>
                <select
                  {...register('timezone')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{t('selectTimezone')}</option>
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('languages')}</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {languages.map((lang) => (
                    <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.code)}
                        onChange={() => toggleLanguage(lang.code)}
                        className="rounded"
                      />
                      <span>{lang.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('gender')}</label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value=""></option>
                  <option value="MALE">{t('male')}</option>
                  <option value="FEMALE">{t('female')}</option>
                  <option value="OTHER">{t('other')}</option>
                </select>
              </div>
            </>
          )}

          {/* 기획사 전용 필드 */}
          {userType === 'BUSINESS' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">{t('country')} *</label>
                <select
                  {...register('businessCountry')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">{t('selectCountry')}</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {'businessCountry' in errors && errors.businessCountry && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessCountry.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('city')} *</label>
                <input
                  type="text"
                  {...register('businessCity')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('enterCity')}
                />
                {'businessCity' in errors && errors.businessCity && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessCity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('companyName')} *</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('companyName')}
                />
                {'companyName' in errors && errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('businessRegistrationNumber')} *</label>
                <input
                  type="text"
                  {...register('businessRegistrationNumber')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('businessRegistrationNumber')}
                />
                {'businessRegistrationNumber' in errors && errors.businessRegistrationNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessRegistrationNumber.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {t('registrationFormat')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('businessLicense')}</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={(e) => {
                    // TODO: 파일 업로드 구현
                    console.log('File selected:', e.target.files?.[0])
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('uploadLicense')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('taxId')}</label>
                <input
                  type="text"
                  {...register('taxId')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('taxId')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('address')}</label>
                <input
                  type="text"
                  {...register('businessAddress')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('address')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('website')}</label>
                <input
                  type="url"
                  {...register('website')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('website')}
                />
                {'website' in errors && errors.website && (
                  <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('contactEmail')}</label>
                <input
                  type="email"
                  {...register('contactEmail')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('contactEmail')}
                />
                {'contactEmail' in errors && errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('contactPhone')}</label>
                <input
                  type="tel"
                  {...register('contactPhone')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('contactPhone')}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? tAuth('registerButton') + '...' : tAuth('registerButton')}
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
