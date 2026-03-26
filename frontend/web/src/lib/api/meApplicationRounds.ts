import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type MeRoundEligibility = {
  canSubmit: boolean
  reason: string | null
  submissionStatus: string | null
}

export type MeRoundSubmitBody = {
  videoUrl?: string | null
  fileUrl?: string | null
  textAnswer?: string | null
}

export type MeRoundSubmitResult = {
  submissionStatus: string
  roundNumber: number
}

export const meApplicationRoundsApi = {
  getEligibility: async (applicationId: string, roundId: string): Promise<MeRoundEligibility> => {
    const { data } = await apiClient.get<unknown>(
      `/me/applications/${encodeURIComponent(applicationId)}/rounds/${encodeURIComponent(roundId)}/eligibility`
    )
    return unwrapData<MeRoundEligibility>(data)
  },

  submit: async (
    applicationId: string,
    roundId: string,
    body: MeRoundSubmitBody
  ): Promise<MeRoundSubmitResult> => {
    const { data } = await apiClient.post<unknown>(
      `/me/applications/${encodeURIComponent(applicationId)}/rounds/${encodeURIComponent(roundId)}/submit`,
      body
    )
    return unwrapData<MeRoundSubmitResult>(data)
  },
}
