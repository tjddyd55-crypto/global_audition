'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api/auth'
import { countries, languages, timezones } from '@/lib/utils/countries'

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
      // 언어 배열 처리 - 타입 가드 사용
      let submitData: RegisterFormData = data
      if (userType === 'APPLICANT' && selectedLanguages.length > 0 && data.userType === 'APPLICANT') {
        submitData = {
          ...data,
          languages: selectedLanguages,
        } as RegisterFormData
      }
      await authApi.register(submitData)
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다')
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
        <h1 className="text-3xl font-bold text-center mb-8">회원가입</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 공통 필드 */}
          <div>
            <label className="block text-sm font-medium mb-2">이메일 *</label>
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
            <label className="block text-sm font-medium mb-2">비밀번호 *</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="비밀번호 (최소 8자)"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이름 *</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="이름"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">회원 유형 *</label>
            <select
              {...register('userType')}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="APPLICANT">지망생</option>
              <option value="BUSINESS">기획사</option>
            </select>
          </div>

          {/* 지망생 전용 필드 */}
          {userType === 'APPLICANT' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">국가 *</label>
                <select
                  {...register('country')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">국가를 선택하세요</option>
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
                <label className="block text-sm font-medium mb-2">도시 *</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="도시명"
                />
                {'city' in errors && errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">생년월일 *</label>
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
                <label className="block text-sm font-medium mb-2">전화번호</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="전화번호 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">주소</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="주소 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">시차대</label>
                <select
                  {...register('timezone')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">시차대를 선택하세요 (선택사항)</option>
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">사용 가능한 언어</label>
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
                <label className="block text-sm font-medium mb-2">성별</label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">선택하세요</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
            </>
          )}

          {/* 기획사 전용 필드 */}
          {userType === 'BUSINESS' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">국가 *</label>
                <select
                  {...register('businessCountry')}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">국가를 선택하세요</option>
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
                <label className="block text-sm font-medium mb-2">도시 *</label>
                <input
                  type="text"
                  {...register('businessCity')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="도시명"
                />
                {'businessCity' in errors && errors.businessCity && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessCity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">회사명 *</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="회사명"
                />
                {'companyName' in errors && errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">법인명 *</label>
                <input
                  type="text"
                  {...register('legalName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="공식 법인명"
                />
                {'legalName' in errors && errors.legalName && (
                  <p className="text-red-500 text-sm mt-1">{errors.legalName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">대표자명 *</label>
                <input
                  type="text"
                  {...register('representativeName')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="대표자명"
                />
                {'representativeName' in errors && errors.representativeName && (
                  <p className="text-red-500 text-sm mt-1">{errors.representativeName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">사업자 등록번호 *</label>
                <input
                  type="text"
                  {...register('businessRegistrationNumber')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="사업자 등록번호"
                />
                {'businessRegistrationNumber' in errors && errors.businessRegistrationNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessRegistrationNumber.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  국가별 형식에 맞게 입력해주세요 (예: 한국 123-45-67890, 미국 EIN 등)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">사업자 등록증</label>
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
                  사업자 등록증 파일을 업로드해주세요 (이미지 또는 PDF)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">세금 ID</label>
                <input
                  type="text"
                  {...register('taxId')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="세금 ID (선택사항, 국가별 형식 다름)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">주소</label>
                <input
                  type="text"
                  {...register('businessAddress')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="회사 주소 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">웹사이트</label>
                <input
                  type="url"
                  {...register('website')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://example.com (선택사항)"
                />
                {'website' in errors && errors.website && (
                  <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">연락 이메일</label>
                <input
                  type="email"
                  {...register('contactEmail')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="contact@example.com (선택사항)"
                />
                {'contactEmail' in errors && errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">연락 전화번호</label>
                <input
                  type="tel"
                  {...register('contactPhone')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="전화번호 (선택사항)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">설립 연도</label>
                <input
                  type="number"
                  {...register('establishedYear', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="설립 연도 (선택사항)"
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
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="text-primary-600 hover:underline">
              로그인
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
