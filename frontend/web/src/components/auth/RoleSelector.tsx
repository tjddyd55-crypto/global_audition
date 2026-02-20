'use client'

type Role = 'APPLICANT' | 'AGENCY'

interface RoleSelectorProps {
  role: Role
  onChange: (role: Role) => void
}

export default function RoleSelector({ role, onChange }: RoleSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-3">회원 유형</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('APPLICANT')}
          className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
            role === 'APPLICANT'
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          지망생
        </button>
        <button
          type="button"
          onClick={() => onChange('AGENCY')}
          className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
            role === 'AGENCY'
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          기획사
        </button>
      </div>
    </div>
  )
}
