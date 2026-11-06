import { apiClient } from './client'
import type { PostingBranchOption } from '@/shared/audition/postingBranchChoice'

type AgencySelfRow = {
  id?: string
  countryCode?: string
  displayName?: string
  stage?: string
  approvalState?: string
}

/** 로그인 기획사에 연결된 CRM 지점. 승인·활성 여부는 화면에서 거른다. */
export async function listMyPostingBranches(): Promise<PostingBranchOption[]> {
  const { data } = await apiClient.get<AgencySelfRow[]>('/admin/org/crm/agencies/self')
  return (data ?? []).map((row) => ({
    id: String(row.id ?? ''),
    countryCode: String(row.countryCode ?? '').trim(),
    displayName: String(row.displayName ?? ''),
    stage: String(row.stage ?? ''),
    approvalState: String(row.approvalState ?? ''),
  }))
}
