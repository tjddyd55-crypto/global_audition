'use client'

import { useState } from 'react'
import { useRouter } from '../../../i18n.config'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../../lib/api/auth'
import { Link } from '../../../i18n.config'
import RoleSelectCard from '../../../components/auth/RoleSelectCard'
import AuthCardLayout from '../../../components/auth/AuthCardLayout'
import { SIGNUP } from '../../../lib/design-tokens'

const registerSchema = z.object({
  email: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .email('유효한 이메일을 입력해주세요'),
  password: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z
    .string({ required_error: '필수값을 입력하세요' })
    .min(1, '필수값을 입력하세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>
type RegisterRole = 'APPLICANT' | 'AGENCY'

const inputStyle: React.CSSProperties = {
  height: SIGNUP.inputHeightPx,
  width: '100%',
  borderRadius: SIGNUP.inputRadiusPx,
  border: `1px solid ${SIGNUP.inputBorderColor}`,
  padding: `0 ${SIGNUP.inputPaddingPx}px`,
  fontSize: SIGNUP.inputFontSizePx,
  boxSizing: 'border-box',
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<RegisterRole>('APPLICANT')

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.signup({ email: data.email, password: data.password, role })
      if (role === 'AGENCY') router.push('/my/dashboard')
      else router.push('/auditions')
    } catch (err: any) {
      if (!err.response) setError('서버 연결 실패')
      else if (err.response.status === 400) setError('필수값을 입력하세요')
      else if (err.response.status === 409) setError('이미 가입된 이메일입니다.')
      else setError(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCardLayout title="회원가입">
      {error && (
        <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 14, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <RoleSelectCard value={role} onChange={setRole} />

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            이메일
          </label>
          <input id="email" type="email" {...register('email')} placeholder="your@email.com" style={inputStyle} />
          {errors.email && <p style={{ marginTop: 4, fontSize: 12, color: '#b91c1c' }}>{errors.email.message}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            비밀번호
          </label>
          <input id="password" type="password" {...register('password')} placeholder="6자 이상" style={inputStyle} />
          {errors.password && <p style={{ marginTop: 4, fontSize: 12, color: '#b91c1c' }}>{errors.password.message}</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            비밀번호 확인
          </label>
          <input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="비밀번호 확인" style={inputStyle} />
          {errors.confirmPassword && <p style={{ marginTop: 4, fontSize: 12, color: '#b91c1c' }}>{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
            color: 'white',
            fontSize: 14,
            fontWeight: 500,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? '처리 중...' : '회원가입'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' }}>
        이미 계정이 있으신가요?{' '}
        <Link href="/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
          로그인
        </Link>
      </p>
    </AuthCardLayout>
  )
}
