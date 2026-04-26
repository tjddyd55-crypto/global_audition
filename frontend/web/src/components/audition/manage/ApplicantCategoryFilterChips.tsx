'use client'

import { TEXT_SUB } from '@/shared/ui/specClasses'

type ApplicantCategoryItem = {
  name: string
  count: number
}

type ApplicantCategoryFilterChipsProps = {
  categories: ApplicantCategoryItem[]
  selectedCategory: string | null
  onChange: (category: string | null) => void
}

export default function ApplicantCategoryFilterChips({
  categories,
  selectedCategory,
  onChange,
}: ApplicantCategoryFilterChipsProps) {
  if (categories.length === 0) return null

  return (
    <div>
      <p className={`${TEXT_SUB} mb-2 flex items-center gap-2 font-medium text-gray-900`}>
        분야(영상 카테고리)
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const active =
            (c.name === '전체' && selectedCategory === null) ||
            (c.name !== '전체' && selectedCategory === c.name)
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onChange(c.name === '전체' ? null : c.name)}
              className={
                active
                  ? 'rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm'
                  : 'rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
              }
            >
              {`${c.name}${c.name === '전체' ? '' : ` (${c.count})`}`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
