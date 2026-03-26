import { apiClient } from './client'

export type AdminAuditionRoundRow = {
  id: string
  roundNumber: number
  roundName: string
  reviewMethod: string
  requiredSubmissionType: string
  startAt: string | null
  endAt: string | null
  active: boolean
  submissionCount: number
  passedCount: number
}

export type AdminRoundApplicantRow = {
  applicationId: string
  roundSubmissionId: string
  applicantEmail: string | null
  applicantDisplayName: string | null
  applicationCurrentRoundNumber: number
  finalStatus: string | null
  latestResultStatus: string | null
  submissionStatus: string
  submittedAt: string | null
}

function parseRound(raw: Record<string, unknown>): AdminAuditionRoundRow {
  return {
    id: String(raw.id ?? ''),
    roundNumber: Number(raw.roundNumber ?? 0) || 0,
    roundName: String(raw.roundName ?? ''),
    reviewMethod: String(raw.reviewMethod ?? ''),
    requiredSubmissionType: String(raw.requiredSubmissionType ?? ''),
    startAt: raw.startAt != null ? String(raw.startAt) : null,
    endAt: raw.endAt != null ? String(raw.endAt) : null,
    active: Boolean(raw.active),
    submissionCount: Number(raw.submissionCount ?? 0) || 0,
    passedCount: Number(raw.passedCount ?? 0) || 0,
  }
}

function parseApplicant(raw: Record<string, unknown>): AdminRoundApplicantRow {
  return {
    applicationId: String(raw.applicationId ?? ''),
    roundSubmissionId: String(raw.roundSubmissionId ?? ''),
    applicantEmail: raw.applicantEmail != null ? String(raw.applicantEmail) : null,
    applicantDisplayName: raw.applicantDisplayName != null ? String(raw.applicantDisplayName) : null,
    applicationCurrentRoundNumber: Number(raw.applicationCurrentRoundNumber ?? 0) || 0,
    finalStatus: raw.finalStatus != null ? String(raw.finalStatus) : null,
    latestResultStatus: raw.latestResultStatus != null ? String(raw.latestResultStatus) : null,
    submissionStatus: String(raw.submissionStatus ?? ''),
    submittedAt: raw.submittedAt != null ? String(raw.submittedAt) : null,
  }
}

export const adminAuditionRoundsApi = {
  listRounds: async (auditionId: string): Promise<AdminAuditionRoundRow[]> => {
    const { data } = await apiClient.get<unknown[]>(`/admin/auditions/${encodeURIComponent(auditionId)}/rounds`)
    return Array.isArray(data) ? data.map((x) => parseRound(x as Record<string, unknown>)) : []
  },

  openRound: async (auditionId: string, roundId: string): Promise<AdminAuditionRoundRow> => {
    const { data } = await apiClient.post<Record<string, unknown>>(
      `/admin/auditions/${encodeURIComponent(auditionId)}/rounds/${encodeURIComponent(roundId)}/open`
    )
    return parseRound(data ?? {})
  },

  closeRound: async (auditionId: string, roundId: string): Promise<AdminAuditionRoundRow> => {
    const { data } = await apiClient.post<Record<string, unknown>>(
      `/admin/auditions/${encodeURIComponent(auditionId)}/rounds/${encodeURIComponent(roundId)}/close`
    )
    return parseRound(data ?? {})
  },

  listApplicants: async (auditionId: string, roundId: string): Promise<AdminRoundApplicantRow[]> => {
    const { data } = await apiClient.get<unknown[]>(
      `/admin/auditions/${encodeURIComponent(auditionId)}/rounds/${encodeURIComponent(roundId)}/applications`
    )
    return Array.isArray(data) ? data.map((x) => parseApplicant(x as Record<string, unknown>)) : []
  },

  pass: async (applicationId: string, roundId: string): Promise<void> => {
    await apiClient.post(`/admin/applications/${encodeURIComponent(applicationId)}/rounds/${encodeURIComponent(roundId)}/pass`, {})
  },

  fail: async (applicationId: string, roundId: string, reason?: string): Promise<void> => {
    await apiClient.post(
      `/admin/applications/${encodeURIComponent(applicationId)}/rounds/${encodeURIComponent(roundId)}/fail`,
      reason ? { reason } : {}
    )
  },

  hold: async (applicationId: string, roundId: string, reason?: string): Promise<void> => {
    await apiClient.post(
      `/admin/applications/${encodeURIComponent(applicationId)}/rounds/${encodeURIComponent(roundId)}/hold`,
      reason ? { reason } : {}
    )
  },
}
