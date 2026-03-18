'use client'

type SignupRole = 'APPLICANT' | 'AGENCY'

interface RoleSelectCardProps {
  value: SignupRole
  onChange: (role: SignupRole) => void
}

interface Option {
  role: SignupRole
  title: string
  description: string
  activeStyle: string
  dotStyle: string
}

const options: Option[] = [
  {
    role: 'APPLICANT',
    title: '지원자',
    description: '오디션에 지원하고 싶어요',
    activeStyle: 'border-purple-400 bg-[#f7efff]',
    dotStyle: 'bg-purple-600',
  },
  {
    role: 'AGENCY',
    title: '기획사',
    description: '기획사이며 오디션을 등록하고 싶어요',
    activeStyle: 'border-pink-400 bg-[#fff1f8]',
    dotStyle: 'bg-pink-600',
  },
]

export default function RoleSelectCard({ value, onChange }: RoleSelectCardProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-800">역할</p>
      {options.map((option) => {
        const selected = option.role === value
        return (
          <button
            key={option.role}
            type="button"
            onClick={() => onChange(option.role)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
              selected ? option.activeStyle : 'border-gray-200 bg-white'
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white">
              {selected && <span className={`h-2 w-2 rounded-full ${option.dotStyle}`} />}
            </span>
            <span>
              <strong className="mr-1 text-sm text-gray-900">{option.title}</strong>
              <span className="text-sm text-gray-500">{option.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
