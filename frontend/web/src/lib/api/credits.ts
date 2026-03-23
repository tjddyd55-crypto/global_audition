import { apiClient } from './client'
import { apiFetch, ApiFetchError } from './apiFetch'

/**
 * 결제 콜백은 Spring `@ResponseStatus(NO_CONTENT)` → **204**.
 * 표준 `fetch`에서는 204도 `res.ok === true` 이지만, 프록시/커스텀 스택에서 `ok`만 믿지 않고 **204를 명시 성공**으로 둔다.
 */
async function assertPaymentCallbackOk(res: Response): Promise<void> {
  if (res.ok || res.status === 204) {
    return
  }
  const text = await res.text()
  throw new ApiFetchError(res.status, text, res.url)
}

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
  orderNo: string
  /** 하위 호환 */
  orderId: string
  packageId: string
  packageName: string
  amount: number
  credits: number
  bonusCredits: number
  currency: string
  status: string
  message: string
  redirectUrl?: string
  provider?: string
}

export type CreditOrderSummary = {
  orderNo: string
  status: string
  provider: string
  amount: number
  currency: string
  credits: number
  bonusCredits: number
  packageId: string
  packageName: string
  paidAt?: string | null
  failReason?: string | null
  createdAt: string
}

/** 목 결제 UI 노출 여부 (미설정 시 true 로 간주해 개발 편의) */
export function isMockPaymentUiEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_CREDIT_MOCK_PAYMENT
  if (v === undefined || v === '') return true
  return v === 'true' || v === '1'
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

  getOrder: async (orderNo: string): Promise<CreditOrderSummary> => {
    const { data } = await apiClient.get<CreditOrderSummary>(`/credits/orders/${encodeURIComponent(orderNo)}`)
    return data
  },

  preparePayment: async (packageId: string, provider = 'MOCK'): Promise<PreparePaymentResult> => {
    const { data } = await apiClient.post<PreparePaymentResult>('/credits/prepare-payment', {
      packageId,
      provider,
    })
    return data
  },

  /**
   * Spring `POST /api/payments/callback/success` — 주문 PAID 전이 + 크레딧 지급(백엔드 단일 진실).
   * Next.js Route Handler/Prisma로 중복 구현하지 말 것.
   */
  paymentSuccessCallback: async (body: {
    orderNo: string
    providerTxId?: string
    payload?: Record<string, unknown> | null
  }): Promise<void> => {
    const res = await apiFetch('/payments/callback/success', {
      method: 'POST',
      body: JSON.stringify({
        orderNo: body.orderNo,
        providerTxId: body.providerTxId ?? null,
        payload: body.payload ?? null,
      }),
    })
    await assertPaymentCallbackOk(res)
  },

  /** Spring `POST /api/payments/callback/fail` */
  paymentFailCallback: async (body: {
    orderNo: string
    reason?: string
    payload?: Record<string, unknown> | null
  }): Promise<void> => {
    const res = await apiFetch('/payments/callback/fail', {
      method: 'POST',
      body: JSON.stringify({
        orderNo: body.orderNo,
        reason: body.reason ?? null,
        payload: body.payload ?? null,
      }),
    })
    await assertPaymentCallbackOk(res)
  },
}
