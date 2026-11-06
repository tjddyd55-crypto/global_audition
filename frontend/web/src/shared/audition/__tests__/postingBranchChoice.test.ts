import {
  postingBranchFieldState,
  postingBranchIdForPayload,
  postingBranchPublishBlock,
  type PostingBranchOption,
  type SavedPostingBranch,
} from '../postingBranchChoice'

const branch = (
  id: string,
  countryCode: string,
  stage = 'ACTIVE',
  approvalState = 'APPROVED',
  displayName = countryCode,
): PostingBranchOption => ({
  id,
  countryCode,
  displayName,
  stage,
  approvalState,
})

const saved = (id: string, countryCode: string, displayName?: string): SavedPostingBranch => ({
  id,
  countryCode,
  displayName,
})

describe('postingBranchChoice', () => {
  it('auto-selects the only approved active branch when nothing is saved', () => {
    const fixed = postingBranchFieldState(
      [branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄'), branch('kr', 'KR', 'ACTIVE', 'PENDING', '서울')],
      '',
      false,
    )
    expect(fixed.kind).toBe('fixed')
    if (fixed.kind === 'fixed') {
      expect(fixed.branch.displayName).toBe('도쿄')
      expect(fixed.branch.countryCode).toBe('JP')
    }
    expect(postingBranchIdForPayload(fixed)).toBe('jp')
    expect(postingBranchPublishBlock(fixed)).toBeNull()

    const none = postingBranchFieldState([], '', false)
    expect(postingBranchIdForPayload(none)).toBeUndefined()
    expect(postingBranchPublishBlock(none)).toBe('none')
  })

  it('preselects the saved branch on edit, including when it is the only usable branch', () => {
    const only = postingBranchFieldState(
      [branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄')],
      '',
      false,
      saved('jp', 'JP', '도쿄'),
    )
    expect(postingBranchIdForPayload(only)).toBe('jp')

    const amongMany = postingBranchFieldState(
      [branch('kr', 'KR', 'ACTIVE', 'APPROVED', '서울'), branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄')],
      '',
      false,
      saved('jp', 'JP', '도쿄'),
    )
    expect(amongMany.kind).toBe('choose')
    expect(postingBranchIdForPayload(amongMany)).toBe('jp')
    expect(postingBranchPublishBlock(amongMany)).toBeNull()
  })

  it('requires an explicit choice when several branches are approved and none is saved', () => {
    const open = postingBranchFieldState(
      [branch('kr', 'KR', 'ACTIVE', 'APPROVED', '서울'), branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄')],
      '',
      false,
    )
    expect(open.kind).toBe('choose')
    expect(postingBranchPublishBlock(open)).toBe('required')
    expect(postingBranchIdForPayload(open)).toBeUndefined()

    const chosen = postingBranchFieldState(
      [branch('kr', 'KR', 'ACTIVE', 'APPROVED', '서울'), branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄')],
      'jp',
      false,
    )
    expect(postingBranchIdForPayload(chosen)).toBe('jp')
    expect(postingBranchPublishBlock(chosen)).toBeNull()
  })

  it('does not replace an unusable saved branch, even when one other branch is usable', () => {
    const stopped = postingBranchFieldState(
      [
        branch('old', 'KR', 'STOPPED', 'APPROVED', '서울'),
        branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄'),
        branch('pending', 'MN', 'ACTIVE', 'PENDING', '울란바토르'),
      ],
      'old',
      false,
      saved('old', 'KR', '서울'),
    )
    expect(stopped.kind).toBe('stale')
    if (stopped.kind === 'stale') {
      expect(stopped.saved).toEqual({ id: 'old', displayName: '서울', countryCode: 'KR' })
      expect(stopped.choices.map((row) => row.id)).toEqual(['jp'])
    }
    expect(postingBranchIdForPayload(stopped)).toBeUndefined()
    expect(postingBranchPublishBlock(stopped)).toBe('required')

    const replaced = postingBranchFieldState(
      [branch('old', 'KR', 'STOPPED', 'APPROVED', '서울'), branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄')],
      'jp',
      false,
      saved('old', 'KR', '서울'),
    )
    expect(postingBranchIdForPayload(replaced)).toBe('jp')
  })

  it('shows a saved branch that is no longer in the owned list and still refuses to swap', () => {
    const missing = postingBranchFieldState(
      [branch('jp', 'JP', 'ACTIVE', 'APPROVED', '도쿄')],
      '',
      false,
      saved('foreign', 'MN'),
    )
    expect(missing.kind).toBe('stale')
    if (missing.kind === 'stale') {
      expect(missing.saved.countryCode).toBe('MN')
      expect(missing.choices).toHaveLength(1)
    }
    expect(postingBranchIdForPayload(missing)).toBeUndefined()

    const nowhere = postingBranchFieldState([], '', false, { id: 'gone' })
    expect(postingBranchPublishBlock(nowhere)).toBe('none')
    expect(postingBranchIdForPayload(nowhere)).toBeUndefined()
  })

  it('does not guess a branch while the list or the saved audition is still loading', () => {
    expect(postingBranchFieldState(undefined, '', false).kind).toBe('loading')
    expect(postingBranchFieldState(undefined, '', true).kind).toBe('unavailable')
    expect(postingBranchPublishBlock(postingBranchFieldState(undefined, '', true))).toBeNull()
    expect(postingBranchFieldState([branch('jp', 'JP')], '', false, null, true).kind).toBe('loading')
    expect(postingBranchIdForPayload(postingBranchFieldState([branch('jp', 'JP')], '', false, null, true))).toBeUndefined()
  })
})
