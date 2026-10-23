'use client'

import { SIGNUP } from '@/shared/design-tokens'

type SignupRole = 'APPLICANT' | 'AGENCY'

interface RoleSelectCardProps {
  value: SignupRole
  onChange: (role: SignupRole) => void
}

export const AGENCY_SIGNUP_PREPARING_MESSAGE =
  '기획사 가입은 본사 승인 절차를 준비 중입니다. 지금은 지원자로만 가입할 수 있습니다.'

const options: { role: SignupRole; title: string; description: string; disabled?: boolean }[] = [
  { role: 'APPLICANT', title: '지원자', description: '오디션에 지원하고 싶어요' },
  { role: 'AGENCY', title: '기획사', description: '승인 절차 준비 중', disabled: true },
]

export default function RoleSelectCard({ value, onChange }: RoleSelectCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SIGNUP.roleGapPx, marginBottom: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px 0' }}>역할</p>
      {options.map((option) => {
        const selected = option.role === value
        return (
          <button
            key={option.role}
            type="button"
            disabled={option.disabled}
            aria-disabled={option.disabled}
            onClick={() => {
              if (!option.disabled) onChange(option.role)
            }}
            style={{
              padding: '12px 12px',
              borderRadius: 8,
              border: selected ? `2px solid ${SIGNUP.roleSelectedBorder}` : '1px solid #ddd',
              background: selected ? SIGNUP.roleSelectedBg : 'white',
              textAlign: 'left',
              cursor: option.disabled ? 'not-allowed' : 'pointer',
              opacity: option.disabled ? 0.55 : 1,
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 600 }}>{option.title}</span>
            <span style={{ color: '#666', marginLeft: 4 }}>{option.description}</span>
          </button>
        )
      })}
      <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{AGENCY_SIGNUP_PREPARING_MESSAGE}</p>
    </div>
  )
}
