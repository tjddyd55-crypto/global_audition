'use client'

import { useTranslations } from 'next-intl'
import { TEXT_SUB } from '@/shared/ui/specClasses'
import { isAllCategoryName } from '@/shared/audition/allCategorySentinel'

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
  const t = useTranslations('agency')
  if (categories.length === 0) return null

  return (
    <div>
      <p className={`${TEXT_SUB} mb-2 flex items-center gap-2 whitespace-normal break-words font-medium text-gray-900`}>
        {t('categoryField')}
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const isAll = isAllCategoryName(c.name)
          const active = (isAll && selectedCategory === null) || (!isAll && selectedCategory === c.name)
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onChange(isAll ? null : c.name)}
              className={
                active
                  ? 'min-h-11 whitespace-normal break-words rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm'
                  : 'min-h-11 whitespace-normal break-words rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
              }
            >
              {isAll ? t('all') : `${c.name} (${c.count})`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
