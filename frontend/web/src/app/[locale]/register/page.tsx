'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api/auth'
import { countries, languages, timezones } from '@/lib/utils/countries'
import { useTranslations } from 'next-intl'

// 지망생 스키마
const applicantSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
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

// 기획사 스키마
const businessSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  userType: z.literal('BUSINESS'),
  businessCountry: z.string().length(2, '국가를 선택해주세요'),
  businessCity: z.string().min(1, '도시를 입력해주세요'),
  companyName: z.string().min(1, '회사명을 입력해주세요'),
  legalName: z.string().min(1, '법인명을 입력해주세요'),
  representativeName: z.string().min(1, '대표자명을 입력해주세요'),
  businessRegistrationNumber: z.string().min(1, '사업자 등록번호를 입력해주세요'),
  businessLicenseDocumentUrl: z.string().optional(),
  taxId: z.string().optional(),
  businessAddress: z.string().optional(),
  website: z.string().url('유효한 URL을 입력해주세요').optional().or(z.literal('')),
  contactEmail: z.string().email('유효한 이메일을 입력해주세요').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
})

const registerSchema = z.discriminatedUnion('userType', [applicantSchema, businessSchema])

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
      // 언어 배열 처리
      if (userType === 'APPLICANT' && selectedLanguages.length > 0) {
        data.languages = selectedLanguages
      }
      
      // 디버깅: 전송 데이터 확인
      console.log('회원가입 요청 데이터:', data)
      
      await authApi.register(data)
      router.push('/')
    } catch (err: any) {
      console.error('회원가입 오류:', err)
      console.error('오류 응답:', err.response?.data)
      
      // 백엔드에서 보낸 상세 오류 메시지 추출
      let errorMessage = tAuth('registerError')
      
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Spring Validation 오류 메시지 처리
        if (errorData.errors && typeof errorData.errors === 'object') {
          // 필드별 오류 메시지가 있는 경우
          const fieldErrors = Object.values(errorData.errors) as string[]
          errorMessage = fieldErrors.join(', ')
        } else if (errorData.message) {
          errorMessage = errorData.message
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

          {/* 공통 필드 */}
          <div>
            <label className="block text-sm font-medium mb-2">{tAuth('email')} *</label>
            <input
              type="email"
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
              {...register('password')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={tAuth('password')}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
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
            {errors.name && (
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
                {errors.country && (
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
                {errors.city && (
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
                {errors.birthday && (
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
                {errors.businessCountry && (
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
                {errors.businessCity && (
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
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('legalName')} *</label>
                <input
                  type="text"
                  {...register('legalName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('legalName')}
                />
                {errors.legalName && (
                  <p className="text-red-500 text-sm mt-1">{errors.legalName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('representativeName')} *</label>
                <input
                  type="text"
                  {...register('representativeName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('representativeName')}
                />
                {errors.representativeName && (
                  <p className="text-red-500 text-sm mt-1">{errors.representativeName.message}</p>
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
                {errors.businessRegistrationNumber && (
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
                {errors.website && (
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
                {errors.contactEmail && (
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

              <div>
                <label className="block text-sm font-medium mb-2">{t('establishedYear')}</label>
                <input
                  type="number"
                  {...register('establishedYear', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={t('establishedYear')}
                  min={1800}
                  max={new Date().getFullYear()}
                />
                {errors.establishedYear && (
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
