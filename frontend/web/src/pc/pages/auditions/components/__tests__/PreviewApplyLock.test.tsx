import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import PcAuditionDetailApplyBar from '../PcAuditionDetailApplyBar'

function renderLocked() {
  return render(
    <NextIntlClientProvider locale="ko" messages={{ apply: { previewApplyDisabled: '미리보기에서는 지원할 수 없습니다' }, auditionDetail: {} }}>
      <PcAuditionDetailApplyBar
        interactionsDisabled
        auditionId="aud-1"
        isOpen
        alreadyApplied={false}
        showApplySubmitCta
        showApplyLoginCta
        showApplyDisabledCta={false}
        applyNavDisabledCombined={false}
        applyNavBlockedBySeries={false}
        applyPolicyLoading={false}
        balanceLoading={false}
        isMultiRoundAudition={false}
        myApplicantRoundNumber={1}
        creditBalanceAmount={10}
        needCreditsForApply={false}
        creditGateReady
        hasEnoughCredits
        applyPolicyError={false}
      />
    </NextIntlClientProvider>,
  )
}

describe('preview apply lock', () => {
  it('지원 링크를 만들지 않고 버튼을 비활성화한다', () => {
    renderLocked()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('button', { name: '미리보기에서는 지원할 수 없습니다' })).toBeDisabled()
  })
})
