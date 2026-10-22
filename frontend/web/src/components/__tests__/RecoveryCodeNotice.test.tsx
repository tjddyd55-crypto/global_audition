import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ko from '../../../messages/ko.json'
import { RecoveryCodeNotice } from '../auth/RecoveryCodeNotice'

describe('RecoveryCodeNotice', () => {
  it('shows the issued code and requires acknowledgement before continue', () => {
    const onAcknowledged = jest.fn()
    render(
      <NextIntlClientProvider locale="ko" messages={ko}>
        <RecoveryCodeNotice recoveryCode="ABCD-2345-EFGH" onAcknowledged={onAcknowledged} />
      </NextIntlClientProvider>,
    )

    expect(screen.getByText('ABCD-2345-EFGH')).toBeInTheDocument()
    const continueButton = screen.getByRole('button', { name: '확인 후 계속' })
    expect(continueButton).toBeDisabled()

    fireEvent.click(screen.getByLabelText(/안전한 곳에 코드를 저장/))
    expect(continueButton).toBeEnabled()
    fireEvent.click(continueButton)
    expect(onAcknowledged).toHaveBeenCalledTimes(1)
  })
})
