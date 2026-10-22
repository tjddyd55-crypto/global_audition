import { isAxiosError } from 'axios'
import { apiClient } from './client'

export function orgErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    return data?.message ?? err.message
  }
  return '요청 실패'
}

export type CountryRow = {
  code: string
  name: string
  status: string
  currency: string
  representativeUserId: string | null
}

export type AgencyRow = {
  id: string
  countryCode: string
  displayName: string
  legalName: string | null
  stage: string
  approvalState: string
  assignedStaffUserId: string | null
}

export type ContractView = {
  id: string
  contractNumber: string
  countryCode: string
  counterpartyName: string
  status: string
  versionNo: number
  revenueShareBps: number | null
  settlementBasis: string | null
  roundingPolicy: string | null
  payoutCurrency: string | null
  paymentFeeUsd: number | null
  extraDeductionUsd: number | null
  startDate: string
  endDate: string | null
  refundDeductionBasis?: string | null
  paymentFeeDeductionBasis?: string | null
  extraDeductionBasis?: string | null
  cycle?: string | null
}

export type SettlementView = {
  id: string
  countryCode: string
  contractId: string
  period: string
  status: string
  settlementBaseUsd: number | null
  compensationUsd: number | null
  hqShareUsd: number | null
  note: string | null
  payoutNote: string | null
  figureKind?: string | null
  payoutCurrency?: string | null
  compensationFinal?: string | null
  compensationRaw?: string | null
  compensationDiff?: string | null
  settlementBaseFinal?: string | null
  hqShareFinal?: string | null
}

export type CountrySlice = {
  country: string
  auditions: number
  applications: number
  accountingRevenueUsd: number
  refundsUsd: number
  salesFeeSnapshotUsd: number
  salesCashUsd: number | null
  settlementBaseUsd: number
  compensationUsd: number
  hqShareUsd: number
  settledCount: number
  unsettledCount: number
}

export type GlobalStats = {
  countries: number
  activeCountryAdmins: number
  agenciesRegistered: number
  agenciesApproved: number
  auditionsUnlinked: number
  slices: CountrySlice[]
  accountingLabel: string
  salesLabel: string
  cashToUsageMapping: string
}

export type Policy = {
  cashToUsageMapping: string
  roundingPolicy: string
  creditParity: string
  notes: string[]
}

export const orgAdminApi = {
  async countries() {
    const { data } = await apiClient.get<CountryRow[]>('/admin/org/countries')
    return data
  },
  async createCountry(body: { code: string; name: string; defaultCurrency: string }) {
    const { data } = await apiClient.post<CountryRow>('/admin/org/countries', body)
    return data
  },
  async appoint(code: string, userId: string, reason: string) {
    await apiClient.post(`/admin/org/countries/${code}/representative`, { userId, reason })
  },
  async addStaff(code: string, userId: string, permissions: string[]) {
    await apiClient.post(`/admin/org/countries/${code}/staff`, { userId, permissions })
  },
  async agencies(country: string) {
    const { data } = await apiClient.get<AgencyRow[]>('/admin/org/crm/agencies', { params: { country } })
    return data
  },
  async decide(id: string, action: string, reason: string) {
    const { data } = await apiClient.post<AgencyRow>(`/admin/org/crm/agencies/${id}/decision`, { action, reason })
    return data
  },
  async consult(id: string, body: string, followUpOn?: string) {
    await apiClient.post(`/admin/org/crm/agencies/${id}/consultations`, {
      body,
      followUpOn: followUpOn || null,
    })
  },
  async contracts(country: string) {
    const { data } = await apiClient.get<ContractView[]>('/admin/org/contracts', { params: { country } })
    return data
  },
  async createContract(body: Record<string, unknown>) {
    const { data } = await apiClient.post<ContractView>('/admin/org/contracts', body)
    return data
  },
  async settlements(country: string) {
    const { data } = await apiClient.get<SettlementView[]>('/admin/org/settlements', { params: { country } })
    return data
  },
  async calculate(countryCode: string, contractId: string, period: string) {
    const { data } = await apiClient.post<SettlementView>('/admin/org/settlements/calculate', {
      countryCode,
      contractId,
      period,
    })
    return data
  },
  async reviewSettlement(id: string) {
    const { data } = await apiClient.post<SettlementView>(`/admin/org/settlements/${id}/review`)
    return data
  },
  async approveSettlement(id: string) {
    const { data } = await apiClient.post<SettlementView>(`/admin/org/settlements/${id}/approve`)
    return data
  },
  async recordPayout(id: string, note: string) {
    const { data } = await apiClient.post<SettlementView>(`/admin/org/settlements/${id}/payout`, { note })
    return data
  },
  async globalStats(country?: string) {
    const { data } = await apiClient.get<GlobalStats>('/admin/org/stats/global', { params: { country } })
    return data
  },
  async countryStats(country: string) {
    const { data } = await apiClient.get<Record<string, unknown>>('/admin/org/stats/country', { params: { country } })
    return data
  },
  async policy() {
    const { data } = await apiClient.get<Policy>('/admin/org/policy')
    return data
  },
  async metrics(country: string, period?: string) {
    const { data } = await apiClient.get<CountryMetrics>('/admin/org/workspace/metrics', { params: { country, period } })
    return data
  },
  async overview(period?: string) {
    const { data } = await apiClient.get<CountryMetrics[]>('/admin/org/workspace/overview', { params: { period } })
    return data
  },
  async auditions(country: string) {
    const { data } = await apiClient.get<AuditionOps[]>('/admin/org/workspace/auditions', { params: { country } })
    return data
  },
  async usage(country: string, period?: string) {
    const { data } = await apiClient.get<UsagePoint[]>('/admin/org/workspace/usage', { params: { country, period } })
    return data
  },
  async account() {
    const { data } = await apiClient.get<AccountPrefs>('/admin/org/workspace/account')
    return data
  },
  async saveAccount(body: AccountPrefs) {
    const { data } = await apiClient.put<AccountPrefs>('/admin/org/workspace/account', body)
    return data
  },
  async staff(country: string) {
    const { data } = await apiClient.get<StaffView[]>(`/admin/org/countries/${country}/staff`)
    return data
  },
  async deactivateStaff(country: string, userId: string) {
    await apiClient.post(`/admin/org/countries/${country}/staff/${userId}/deactivate`)
  },
  async assignAgency(country: string, userId: string, agencyId: string) {
    await apiClient.post(`/admin/org/countries/${country}/staff/${userId}/agencies`, { agencyId })
  },
  async registerAgency(body: Record<string, unknown>) {
    const { data } = await apiClient.post<AgencyRow>('/admin/org/crm/agencies', body)
    return data
  },
  async changeStage(id: string, stage: string, reason: string) {
    const { data } = await apiClient.post<AgencyRow>(`/admin/org/crm/agencies/${id}/stage`, { stage, reason })
    return data
  },
  async activityLog(country: string, agencyId?: string) {
    const { data } = await apiClient.get<ActivityRow[]>('/admin/org/crm/agencies/activity-log', {
      params: { country, agencyId },
    })
    return data
  },
  async previewSettlement(country: string, contractId: string, period: string) {
    const { data } = await apiClient.get<SettlementView>('/admin/org/settlements/preview', {
      params: { country, contractId, period },
    })
    return data
  },
  async statementCsv(id: string) {
    const { data } = await apiClient.get<string>(`/admin/org/settlements/${id}/statement`, { responseType: 'text' })
    return data
  },
  async contractVersions(id: string) {
    const { data } = await apiClient.get<ContractVersion[]>(`/admin/org/contracts/${id}/versions`)
    return data
  },
}

export type CountryMetrics = {
  countryCode: string
  countryName: string
  currency: string
  representativeUserId: string | null
  representativeName: string | null
  agenciesRegistered: number
  agenciesApproved: number
  liveAuditions: number
  monthlyApplications: number
  feePerformanceUsd: number
  refundsUsd: number | null
  settlementBaseUsd: number | null
  rateBps: number | null
  expectedCompensation: string | null
  expectedStatus: string | null
  lastMonthConfirmedCompensation: string | null
  pendingApprovals: number
  freeUsageCredits: number
  paidUsageCredits: number
  reviewCredits: number
}

export type AuditionOps = {
  id: string
  title: string
  status: string
  startAt: string | null
  endAt: string | null
  agencyId: string
  agencyName: string
  applicants: number
  feeUsd: number
  judgingStatus: string | null
}

export type UsagePoint = {
  day: string
  month: string
  applications: number
  freeCredits: number
  paidCredits: number
  settleableUsd: number | null
  reviewCredits: number
}

export type AccountPrefs = { emailEnabled: boolean; locale: 'ko' | 'ja' | 'en' }

export type StaffView = {
  assignmentId: string
  userId: string
  status: string
  email: string
  displayName: string
  permissions: string[]
  agencyIds: string[]
}

export type ActivityRow = {
  id: string
  agencyId: string
  actorId: string
  kind: string
  body: string
  followUpOn: string | null
  createdAt: string
}

export type ContractVersion = {
  id: string
  versionNo: number
  startDate: string
  endDate: string | null
  revenueShareBps: number | null
  settlementBasis: string | null
  payoutCurrency: string | null
  status?: string
}
