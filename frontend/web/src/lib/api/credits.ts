import { apiClient } from './client'

export type CreditBalance = {
  balance: number
}

export type CreditTransactionItem = {
  id: string
  userId: string
  amount: number
  type: string
  reason: string
  referenceId: string | null
  grantedBy?: string | null
  note?: string | null
  beforeBalance?: number | null
  afterBalance?: number | null
  createdAt: string
}

export type CreditPackageCatalogItem = {
  id: string
  name: string
  price: number
  credits: number
  bonusCredits: number
}

export type CreditsTransactionPage = {
  content: CreditTransactionItem[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type PreparePaymentResult = {
  orderId: string
  packageId: string
  packageName: string
  amount: number
  credits: number
  bonusCredits: number
  currency: string
  status: string
  message: string
}

export const creditsApi = {
  getBalance: async (): Promise<CreditBalance> => {
    const { data } = await apiClient.get<CreditBalance>('/credits/balance')
    return data
  },

  getTransactions: async (page = 0, size = 20): Promise<CreditsTransactionPage> => {
    const { data } = await apiClient.get<CreditsTransactionPage>('/credits/transactions', {
      params: { page, size },
    })
    return data
  },

  listPackages: async (): Promise<CreditPackageCatalogItem[]> => {
    const { data } = await apiClient.get<CreditPackageCatalogItem[]>('/credit-packages')
    return data
  },

  getPackage: async (id: string): Promise<CreditPackageCatalogItem> => {
    const { data } = await apiClient.get<CreditPackageCatalogItem>(`/credit-packages/${encodeURIComponent(id)}`)
    return data
  },

  preparePayment: async (packageId: string): Promise<PreparePaymentResult> => {
    const { data } = await apiClient.post<PreparePaymentResult>('/credits/prepare-payment', { packageId })
    return data
  },
}
