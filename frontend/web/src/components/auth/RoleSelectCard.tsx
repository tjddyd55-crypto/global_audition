'use client'

import { useTranslations } from 'next-intl'
import { SIGNUP } from '@/shared/design-tokens'

type SignupRole = 'APPLICANT' | 'AGENCY'

interface RoleSelectCardProps {
  value: SignupRole
  onChange: (role: SignupRole) => void
}

export default function RoleSelectCard({ value, onChange }: RoleSelectCardProps) {
  const t = useTranslations('auth')
  const options: { role: SignupRole; title: string; description: string }[] = [
    { role: 'APPLICANT', title: t('applicant'), description: t('applicantDesc') },
    { role: 'AGENCY', title: t('business'), description: t('agencyDesc') },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SIGNUP.roleGapPx, marginBottom: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px 0' }}>{t('role')}</p>
      {options.map((option) => {
        const selected = option.role === value
        return (
          <button
            key={option.role}
            type="button"
            onClick={() => onChange(option.role)}
            className="min-h-11 whitespace-normal break-words text-left"
            style={{
              padding: '12px 12px',
              borderRadius: 8,
              border: selected ? `2px solid ${SIGNUP.roleSelectedBorder}` : '1px solid #ddd',
              background: selected ? SIGNUP.roleSelectedBg : 'white',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 600 }}>{option.title}</span>
            <span style={{ color: '#666', marginLeft: 4 }}>{option.description}</span>
          </button>
        )
      })}
    </div>
  )
}
