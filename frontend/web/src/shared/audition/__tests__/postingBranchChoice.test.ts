import {
  postingBranchFieldState,
  postingBranchIdForPayload,
  postingBranchPublishBlock,
  type PostingBranchOption,
} from '../postingBranchChoice'

const approved = (id: string, countryCode: string): PostingBranchOption => ({
  id,
  countryCode,
  displayName: countryCode,
  stage: 'ACTIVE',
  approvalState: 'APPROVED',
})

describe('postingBranchChoice', () => {
  it('auto-selects the only approved active branch and blocks publish when there is none', () => {
    const fixed = postingBranchFieldState([approved('jp', 'JP'), { ...approved('kr', 'KR'), approvalState: 'PENDING' }], '', false)
    expect(fixed.kind).toBe('fixed')
    expect(postingBranchIdForPayload(fixed)).toBe('jp')
    expect(postingBranchPublishBlock(fixed)).toBeNull()

    const none = postingBranchFieldState([], '', false)
    expect(postingBranchIdForPayload(none)).toBeUndefined()
    expect(postingBranchPublishBlock(none)).toBe('none')
  })

  it('requires an explicit choice when several branches are approved', () => {
    const open = postingBranchFieldState([approved('kr', 'KR'), approved('jp', 'JP')], '', false)
    expect(open.kind).toBe('choose')
    expect(postingBranchPublishBlock(open)).toBe('required')
    expect(postingBranchIdForPayload(open)).toBeUndefined()

    const chosen = postingBranchFieldState([approved('kr', 'KR'), approved('jp', 'JP')], 'jp', false)
    expect(postingBranchIdForPayload(chosen)).toBe('jp')
    expect(postingBranchPublishBlock(chosen)).toBeNull()
  })

  it('does not guess a branch while the list is loading or unavailable', () => {
    expect(postingBranchFieldState(undefined, '', false).kind).toBe('loading')
    expect(postingBranchFieldState(undefined, '', true).kind).toBe('unavailable')
    expect(postingBranchPublishBlock(postingBranchFieldState(undefined, '', true))).toBeNull()
  })
})
