'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/shared/api/auth'
import { Link, useRouter } from '@/i18n.config'
import RoleSelectCard from '@/components/auth/RoleSelectCard'
import AuthCardLayout from '@/components/auth/AuthCardLayout'
import { RecoveryCodeNotice } from '@/components/auth/RecoveryCodeNotice'
import { SIGNUP } from '@/shared/design-tokens'
import { createNicknameZodField } from '@/shared/user/nicknameZod'

type RegisterFormData = {
  email: string
  nickname: string
  legalName?: string
  password: string
  confirmPassword: string
}
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

function createRegisterSchema(tAuth: (key: string) => string, tReg: (key: string) => string) {
  return z
    .object({
      email: z.string({ required_error: tAuth('requiredValues') }).min(1, tAuth('requiredValues')).email(tReg('emailInvalid')),
      nickname: createNicknameZodField({
        required: tAuth('nameRequired'),
        length: tAuth('nicknameLen'),
        charset: tAuth('nicknameCharset'),
      }),
      legalName: z.string().max(120, tAuth('legalNameMax')).optional().or(z.literal('')),
      password: z
        .string({ required_error: tAuth('requiredValues') })
        .min(1, tAuth('requiredValues'))
        .min(6, tReg('passwordMin6')),
      confirmPassword: z
        .string({ required_error: tAuth('requiredValues') })
        .min(1, tAuth('requiredValues'))
        .min(6, tReg('passwordMin6')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tAuth('passwordMismatch'),
      path: ['confirmPassword'],
    })
}

export default function PcRegisterPage() {
  const router = useRouter()
  const tAuth = useTranslations('auth')
  const tReg = useTranslations('register')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<RegisterRole>('APPLICANT')
  const [issuedCode, setIssuedCode] = useState<string | null>(null)
  const registerSchema = useMemo(() => createRegisterSchema(tAuth, tReg), [tAuth, tReg])

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await authApi.signup({
        email: data.email,
        password: data.password,
        role,
        nickname: data.nickname.trim(),
        name: data.legalName?.trim() ? data.legalName.trim() : undefined,
      })
      if (res.recoveryCode) {
        setIssuedCode(res.recoveryCode)
        return
      }
      if (role === 'AGENCY') router.push('/my/dashboard')
      else router.push('/auditions')
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } } }
      if (!ax.response) setError(tAuth('serverUnreachable'))
      else if (ax.response.status === 400) setError(tAuth('requiredValues'))
      else if (ax.response.status === 409) setError(tAuth('emailTaken'))
      else setError(ax.response?.data?.message || tAuth('registerError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (issuedCode) {
    return (
      <AuthCardLayout title={tAuth('recoveryCode')}>
        <RecoveryCodeNotice
          recoveryCode={issuedCode}
          onAcknowledged={() => {
            if (role === 'AGENCY') router.push('/my/dashboard')
            else router.push('/auditions')
          }}
        />
      </AuthCardLayout>
    )
  }

  return (
    <AuthCardLayout title={tAuth('registerTitle')}>
      {error && (
        <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 14, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <RoleSelectCard value={role} onChange={setRole} />
        <Field id="email" label={tAuth('email')} error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" {...register('email')} placeholder="your@email.com" style={inputStyle} />
        </Field>
        <Field id="nickname" label={`${tAuth('nickname')} *`} error={errors.nickname?.message}>
          <input id="nickname" type="text" {...register('nickname')} placeholder={tAuth('displayNamePlaceholder')} style={inputStyle} />
        </Field>
        <Field id="legalName" label={tAuth('legalNameOptional')} error={errors.legalName?.message}>
          <input id="legalName" type="text" {...register('legalName')} placeholder={tAuth('legalNamePlaceholder')} style={inputStyle} />
        </Field>
        <Field id="password" label={tAuth('password')} error={errors.password?.message}>
          <input id="password" type="password" autoComplete="new-password" {...register('password')} placeholder={tReg('passwordMin6')} style={inputStyle} />
        </Field>
        <Field id="confirmPassword" label={tAuth('confirmPassword')} error={errors.confirmPassword?.message}>
          <input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} placeholder={tAuth('confirmPasswordPlaceholder')} style={inputStyle} />
        </Field>

        <button
          type="submit"
          disabled={isLoading}
          className="min-h-11 w-full whitespace-normal break-words"
          style={{
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
          {isLoading ? tAuth('processing') : tAuth('registerButton')}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#666' }}>
        {tAuth('alreadyHaveAccount')}{' '}
        <Link href="/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
          {tAuth('loginButton')}
        </Link>
      </p>
    </AuthCardLayout>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {error ? <p style={{ marginTop: 4, fontSize: 12, color: '#b91c1c' }}>{error}</p> : null}
    </div>
  )
}
