import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ko from '../../../../messages/ko.json'
import { PostingBranchField } from '../PostingBranchField'
import type { PostingBranchOption } from '@/shared/audition/postingBranchChoice'

const tokyo: PostingBranchOption = {
  id: 'jp',
  countryCode: 'JP',
  displayName: '도쿄',
  stage: 'ACTIVE',
  approvalState: 'APPROVED',
}

const seoul: PostingBranchOption = {
  id: 'kr',
  countryCode: 'KR',
  displayName: '서울',
  stage: 'ACTIVE',
  approvalState: 'APPROVED',
}

function renderField(state: Parameters<typeof PostingBranchField>[0]['state'], onSelect = jest.fn()) {
  render(
    <NextIntlClientProvider locale="ko" messages={ko}>
      <PostingBranchField state={state} onSelect={onSelect} />
    </NextIntlClientProvider>,
  )
  return onSelect
}

describe('PostingBranchField', () => {
  it('shows the single selected branch with its name and country', () => {
    renderField({ kind: 'fixed', branch: tokyo })
    expect(screen.getByTestId('posting-branch-fixed')).toHaveTextContent('도쿄 (JP)')
    expect(screen.queryByTestId('posting-branch-select')).not.toBeInTheDocument()
  })

  it('shows the saved choice and does not pick another branch by default', () => {
    const onSelect = renderField({ kind: 'choose', branches: [seoul, tokyo], selectedId: 'jp' })
    expect(screen.getByTestId('posting-branch-fixed')).toHaveTextContent('도쿄 (JP)')
    expect(screen.getByTestId('posting-branch-select')).toHaveValue('jp')
    expect(screen.getByRole('option', { name: '서울 (KR)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '대기 (MN)' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('posting-branch-select'), { target: { value: 'kr' } })
    expect(onSelect).toHaveBeenCalledWith('kr')
  })

  it('shows an unusable saved branch and leaves the replacement unselected', () => {
    const onSelect = renderField({
      kind: 'stale',
      saved: { id: 'old', displayName: '서울', countryCode: 'KR' },
      choices: [tokyo],
    })
    expect(screen.getByTestId('posting-branch-stale')).toHaveTextContent('서울 (KR)')
    expect(screen.getByTestId('posting-branch-select')).toHaveValue('')
    expect(screen.getByRole('option', { name: '도쿄 (JP)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '서울 (KR)' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByTestId('posting-branch-select'), { target: { value: 'jp' } })
    expect(onSelect).toHaveBeenCalledWith('jp')
  })
})
