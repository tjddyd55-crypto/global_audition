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
  async consult(id: string, body: string) {
    await apiClient.post(`/admin/org/crm/agencies/${id}/consultations`, { body })
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
}
