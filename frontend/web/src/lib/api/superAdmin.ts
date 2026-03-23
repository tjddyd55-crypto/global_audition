import { apiClient } from './client'

export type CreditPolicyRow = {
  key: string
  cost: number
  active: boolean
  updatedAt: string
}

export type CreditPackageRow = {
  id: string
  name: string
  price: number
  credits: number
  bonusCredits: number
  active: boolean
  sortOrder: number
  createdAt?: string
  updatedAt: string
}

export type UserCreditLookup = {
  userId: string
  email: string
  balance: number
}

export type CreditTransactionRow = {
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

export type AdminLogEntry = {
  id: string
  adminId: string
  action: string
  targetType: string
  targetId: string | null
  payload: Record<string, unknown>
  createdAt: string
}

export type SpringPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/** 백엔드 GRANT reason 허용 값 */
export const CREDIT_GRANT_REASONS = ['ADMIN_GRANT', 'EVENT_REWARD', 'PROMOTION'] as const

export type CreditGrantReason = (typeof CREDIT_GRANT_REASONS)[number]

/** 단일/대량 지급 공통 상한 (백엔드와 동일) */
export const MAX_CREDIT_GRANT_AMOUNT = 10_000

export const superAdminApi = {
  listCreditPolicies: async (): Promise<CreditPolicyRow[]> => {
    const { data } = await apiClient.get<CreditPolicyRow[]>('/admin/credit-policies')
    return data
  },

  patchCreditPolicy: async (
    policyKey: string,
    body: { cost?: number; active?: boolean }
  ): Promise<CreditPolicyRow> => {
    const { data } = await apiClient.patch<CreditPolicyRow>(`/admin/credit-policies/${encodeURIComponent(policyKey)}`, body)
    return data
  },

  listCreditPackages: async (): Promise<CreditPackageRow[]> => {
    const { data } = await apiClient.get<CreditPackageRow[]>('/admin/credit-packages')
    return data
  },

  createCreditPackage: async (body: {
    name: string
    price: number
    credits: number
    bonusCredits: number
    active: boolean
    sortOrder?: number
  }): Promise<CreditPackageRow> => {
    const { data } = await apiClient.post<CreditPackageRow>('/admin/credit-packages', body)
    return data
  },

  updateCreditPackage: async (
    id: string,
    body: {
      name: string
      price: number
      credits: number
      bonusCredits: number
      active: boolean
      sortOrder?: number
    }
  ): Promise<CreditPackageRow> => {
    const { data } = await apiClient.put<CreditPackageRow>(`/admin/credit-packages/${id}`, body)
    return data
  },

  deleteCreditPackage: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/credit-packages/${id}`)
  },

  lookupUser: async (q: string): Promise<UserCreditLookup> => {
    const { data } = await apiClient.get<UserCreditLookup>('/admin/users/lookup', { params: { q } })
    return data
  },

  /** GET /api/admin/users — SUPER_ADMIN, 페이지네이션 (백엔드 Spring Page) */
  listUsersWithCredits: async (params: {
    q?: string
    page?: number
    size?: number
  }): Promise<SpringPage<UserCreditLookup>> => {
    const { data } = await apiClient.get<SpringPage<UserCreditLookup>>('/admin/users', {
      params: {
        q: params.q?.trim() || undefined,
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    })
    return data
  },

  adjustCredits: async (body: {
    userId?: string
    email?: string
    amount: number
    note?: string
  }): Promise<{ userId: string; balanceAfter: number }> => {
    const { data } = await apiClient.post<{ userId: string; balanceAfter: number }>('/admin/credits/adjust', body)
    return data
  },

  /** 운영자 선물 지급 (type: GRANT) */
  grantCredits: async (body: {
    userId: string
    amount: number
    reason: CreditGrantReason
    note?: string
  }): Promise<{ userId: string; balanceAfter: number }> => {
    const { data } = await apiClient.post<{ userId: string; balanceAfter: number }>('/admin/credits/grant', {
      userId: body.userId,
      amount: body.amount,
      reason: body.reason,
      note: body.note || undefined,
    })
    return data
  },

  grantCreditsBulk: async (body: {
    condition: { country?: string; createdAfter?: string }
    amount: number
    reason: CreditGrantReason
    note?: string
  }): Promise<{ affectedUsers: number; totalCreditsGranted: number }> => {
    const { data } = await apiClient.post<{ affectedUsers: number; totalCreditsGranted: number }>(
      '/admin/credits/grant/bulk',
      { ...body, note: body.note || undefined }
    )
    return data
  },

  listAdminLogs: async (params: {
    adminId?: string
    action?: string
    from?: string
    to?: string
    page?: number
    size?: number
  }): Promise<SpringPage<AdminLogEntry>> => {
    const { data } = await apiClient.get<SpringPage<AdminLogEntry>>('/admin/logs', {
      params: {
        adminId: params.adminId || undefined,
        action: params.action || undefined,
        from: params.from || undefined,
        to: params.to || undefined,
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    })
    return data
  },

  patchAdminUser: async (
    userId: string,
    body: Partial<{ displayName: string; bio: string; profileImageUrl: string; countryCode: string }>
  ): Promise<unknown> => {
    const { data } = await apiClient.patch(`/admin/users/${userId}`, body)
    return data
  },

  listCreditTransactions: async (params: {
    userId?: string
    type?: string
    from?: string
    to?: string
    page?: number
    size?: number
  }): Promise<SpringPage<CreditTransactionRow>> => {
    const { data } = await apiClient.get<SpringPage<CreditTransactionRow>>('/admin/transactions', {
      params: {
        userId: params.userId || undefined,
        type: params.type || undefined,
        from: params.from || undefined,
        to: params.to || undefined,
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    })
    return data
  },
}
