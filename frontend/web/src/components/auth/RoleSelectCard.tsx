'use client'

import { SIGNUP } from '../../lib/design-tokens'

type SignupRole = 'APPLICANT' | 'AGENCY'

interface RoleSelectCardProps {
  value: SignupRole
  onChange: (role: SignupRole) => void
}

const options: { role: SignupRole; title: string; description: string }[] = [
  { role: 'APPLICANT', title: '지원자', description: '오디션에 지원하고 싶어요' },
  { role: 'AGENCY', title: '기획사', description: '기획사이며 오디션을 등록하고 싶어요' },
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
            onClick={() => onChange(option.role)}
            style={{
              padding: '12px 12px',
              borderRadius: 8,
              border: selected ? `2px solid ${SIGNUP.roleSelectedBorder}` : '1px solid #ddd',
              background: selected ? SIGNUP.roleSelectedBg : 'white',
              textAlign: 'left',
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
