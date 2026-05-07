'use client'

import { useMemo, useState } from 'react'
import type { AgencyBoardStatus, ManageListFilters } from '@/shared/api/auditions'
import type { RoundTabValue } from '@/components/audition/manage'

export function useApplicantManageFilters() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [minAge, setMinAge] = useState<string>('')
  const [maxAge, setMaxAge] = useState<string>('')
  const [nationalityFilter, setNationalityFilter] = useState<string>('')
  const [hasSnsFilter, setHasSnsFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roundTab, setRoundTab] = useState<RoundTabValue>('all')

  const listFilters: ManageListFilters = useMemo(() => {
    const f: ManageListFilters = { category: categoryFilter }
    if (minAge.trim() !== '') {
      const n = Number(minAge)
      if (!Number.isNaN(n)) f.minAge = n
    }
    if (maxAge.trim() !== '') {
      const n = Number(maxAge)
      if (!Number.isNaN(n)) f.maxAge = n
    }
    if (nationalityFilter) f.nationality = nationalityFilter
    if (hasSnsFilter === 'yes') f.hasSns = true
    if (hasSnsFilter === 'no') f.hasSns = false
    if (statusFilter) f.status = statusFilter as AgencyBoardStatus
    if (roundTab !== 'all') f.round = roundTab
    return f
  }, [categoryFilter, minAge, maxAge, nationalityFilter, hasSnsFilter, statusFilter, roundTab])

  return {
    categoryFilter,
    setCategoryFilter,
    minAge,
    setMinAge,
    maxAge,
    setMaxAge,
    nationalityFilter,
    setNationalityFilter,
    hasSnsFilter,
    setHasSnsFilter,
    statusFilter,
    setStatusFilter,
    roundTab,
    setRoundTab,
    listFilters,
  }
}
