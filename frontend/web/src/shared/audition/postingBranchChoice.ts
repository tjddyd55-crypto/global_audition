export type PostingBranchOption = {
  id: string
  countryCode: string
  displayName: string
  stage: string
  approvalState: string
}

/** 편집 중인 공고에 이미 저장된 게시 지점. 목록에 없어도 이름·국가를 보여 주기 위한 힌트다. */
export type SavedPostingBranch = {
  id: string
  countryCode?: string | null
  displayName?: string | null
}

export type ShownPostingBranch = {
  id: string
  displayName: string
  countryCode: string
}

export type PostingBranchFieldState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'none' }
  | { kind: 'fixed'; branch: PostingBranchOption }
  | { kind: 'choose'; branches: PostingBranchOption[]; selectedId: string }
  | { kind: 'stale'; saved: ShownPostingBranch; choices: PostingBranchOption[] }

export function approvedActiveBranches(rows: PostingBranchOption[]): PostingBranchOption[] {
  return rows.filter((row) => row.stage === 'ACTIVE' && row.approvalState === 'APPROVED' && row.id)
}

/**
 * 게시 지점 필드.
 *
 * 저장된 지점이 아직 쓸 수 있으면 그 지점을 고른 상태로 둔다.
 * 저장된 지점이 없고 승인된 활성 지점이 하나면 그 지점을 자동으로 고른다.
 * 여러 개이고 저장된 값이 없으면 비워 두고 기획사가 고른다.
 * 저장된 지점을 다른 지점으로 바꾸지 않는다. 더 이상 쓸 수 없으면 보여 주고 다시 고르게 한다.
 */
export function postingBranchFieldState(
  rows: PostingBranchOption[] | undefined,
  selectedId: string,
  failed: boolean,
  saved?: SavedPostingBranch | null,
  awaitingSaved = false,
): PostingBranchFieldState {
  if (failed) return { kind: 'unavailable' }
  if (!rows || awaitingSaved) return { kind: 'loading' }
  return resolvePostingBranch(rows, selectedId, saved)
}

function resolvePostingBranch(
  rows: PostingBranchOption[],
  selectedId: string,
  saved?: SavedPostingBranch | null,
): PostingBranchFieldState {
  const eligible = approvedActiveBranches(rows)
  const storedId = storedPostingBranchId(selectedId, saved)
  if (storedId && !eligible.some((branch) => branch.id === storedId)) {
    return { kind: 'stale', saved: savedBranchDisplay(rows, storedId, saved), choices: eligible }
  }
  if (eligible.length === 0) return { kind: 'none' }
  if (eligible.length === 1 && (!storedId || eligible[0].id === storedId)) {
    return { kind: 'fixed', branch: eligible[0] }
  }
  return { kind: 'choose', branches: eligible, selectedId: storedId }
}

/** 화면에서 고른 값이 있으면 그것을 쓰고, 아직 비어 있으면 저장된 지점을 유지한다. */
function storedPostingBranchId(selectedId: string, saved?: SavedPostingBranch | null): string {
  const explicit = selectedId.trim()
  if (explicit) return explicit
  return (saved?.id ?? '').trim()
}

function savedBranchDisplay(
  rows: PostingBranchOption[],
  storedId: string,
  saved?: SavedPostingBranch | null,
): ShownPostingBranch {
  const owned = rows.find((row) => row.id === storedId)
  if (owned) {
    return { id: owned.id, displayName: owned.displayName, countryCode: owned.countryCode }
  }
  if (saved && saved.id === storedId) {
    return {
      id: storedId,
      displayName: (saved.displayName ?? '').trim(),
      countryCode: (saved.countryCode ?? '').trim(),
    }
  }
  return { id: storedId, displayName: '', countryCode: '' }
}

/** 서버로 보낼 지점. 없거나 아직 고르지 않았거나, 저장된 지점을 다른 지점으로 바꾸면 안 되면 undefined. */
export function postingBranchIdForPayload(state: PostingBranchFieldState): string | undefined {
  if (state.kind === 'fixed') return state.branch.id
  if (state.kind === 'choose' && state.selectedId) return state.selectedId
  return undefined
}

/** 게시 전에 막는 이유. 쓸 수 없는 저장 지점은 임시 저장도 다시 고르기 전에는 막는다. */
export function postingBranchPublishBlock(state: PostingBranchFieldState): 'none' | 'required' | null {
  if (state.kind === 'none') return 'none'
  if (state.kind === 'stale') return state.choices.length === 0 ? 'none' : 'required'
  if (state.kind === 'choose' && !state.selectedId) return 'required'
  return null
}
