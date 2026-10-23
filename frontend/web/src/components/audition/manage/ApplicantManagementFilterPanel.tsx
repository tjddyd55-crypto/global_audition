'use client'

import { useTranslations } from 'next-intl'
import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'
import type { AgencyBoardStatus } from '@/shared/api/auditions'
import { nationalityOptionValues } from '@/shared/i18n/nationalityOptions'

type SnsFilterValue = 'all' | 'yes' | 'no'

type ApplicantManagementFilterPanelProps = {
  minAge: string
  maxAge: string
  nationality: string
  status: string
  hasSns: SnsFilterValue
  onMinAgeChange: (value: string) => void
  onMaxAgeChange: (value: string) => void
  onNationalityChange: (value: string) => void
  onStatusChange: (value: AgencyBoardStatus | '') => void
  onHasSnsChange: (value: SnsFilterValue) => void
}

export default function ApplicantManagementFilterPanel({
  minAge,
  maxAge,
  nationality,
  status,
  hasSns,
  onMinAgeChange,
  onMaxAgeChange,
  onNationalityChange,
  onStatusChange,
  onHasSnsChange,
}: ApplicantManagementFilterPanelProps) {
  const t = useTranslations('agency')
  const tNat = useTranslations('nationality')
  const tStatus = useTranslations('status')

  return (
    <div className={`${CARD_BASE} flex flex-col gap-4`}>
      <p className={`${TEXT_SUB} font-semibold text-gray-900`}>{t('filter')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="whitespace-normal break-words text-gray-600">{t('minAge')}</span>
          <input
            type="number"
            min={0}
            value={minAge}
            onChange={(e) => onMinAgeChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-2"
            placeholder={t('ageMinPlaceholder')}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="whitespace-normal break-words text-gray-600">{t('maxAge')}</span>
          <input
            type="number"
            min={0}
            value={maxAge}
            onChange={(e) => onMaxAgeChange(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-2"
            placeholder={t('ageMaxPlaceholder')}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="whitespace-normal break-words text-gray-600">{t('nationality')}</span>
          <select
            value={nationality}
            onChange={(e) => onNationalityChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2"
          >
            {nationalityOptionValues().map((code) => (
              <option key={code === '' ? '_all' : code} value={code}>
                {code === '' ? t('all') : tNat(code)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm">
          <span className="whitespace-normal break-words text-gray-600">{t('reviewStatus')}</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as AgencyBoardStatus | '')}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2"
          >
            <option value="">{t('all')}</option>
            <option value="PENDING">{t('pendingShort')}</option>
            <option value="REVIEWING">{tStatus('underReview')}</option>
            <option value="APPROVED">{tStatus('accepted')}</option>
            <option value="REJECTED">{t('dropped')}</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="whitespace-normal break-words text-gray-600">{t('sns')}</span>
          <select
            value={hasSns}
            onChange={(e) => onHasSnsChange(e.target.value as SnsFilterValue)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-2"
          >
            <option value="all">{t('all')}</option>
            <option value="yes">{t('snsYes')}</option>
            <option value="no">{t('snsNo')}</option>
          </select>
        </label>
      </div>
    </div>
  )
}
