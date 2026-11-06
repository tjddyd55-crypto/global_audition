export type PostingBranchOption = {
  id: string
  countryCode: string
  displayName: string
  stage: string
  approvalState: string
}

export type PostingBranchFieldState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'none' }
  | { kind: 'fixed'; branch: PostingBranchOption }
  | { kind: 'choose'; branches: PostingBranchOption[]; selectedId: string }

export function approvedActiveBranches(rows: PostingBranchOption[]): PostingBranchOption[] {
  return rows.filter((row) => row.stage === 'ACTIVE' && row.approvalState === 'APPROVED' && row.id)
}

export function postingBranchFieldState(
  rows: PostingBranchOption[] | undefined,
  selectedId: string,
  failed: boolean,
): PostingBranchFieldState {
  if (failed) return { kind: 'unavailable' }
  if (!rows) return { kind: 'loading' }
  const branches = approvedActiveBranches(rows)
  if (branches.length === 0) return { kind: 'none' }
  if (branches.length === 1) return { kind: 'fixed', branch: branches[0] }
  return { kind: 'choose', branches, selectedId }
}

/** 서버로 보낼 지점. 없거나 아직 고르지 않았으면 undefined. */
export function postingBranchIdForPayload(state: PostingBranchFieldState): string | undefined {
  if (state.kind === 'fixed') return state.branch.id
  if (state.kind === 'choose' && state.selectedId) return state.selectedId
  return undefined
}

/** 게시 전에 막는 이유. 임시 저장은 막지 않는다. */
export function postingBranchPublishBlock(state: PostingBranchFieldState): 'none' | 'required' | null {
  if (state.kind === 'none') return 'none'
  if (state.kind === 'choose' && !state.selectedId) return 'required'
  return null
}
