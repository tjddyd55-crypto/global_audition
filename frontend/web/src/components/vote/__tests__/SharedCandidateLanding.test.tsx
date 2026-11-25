import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { SharedCandidateLanding } from '../SharedCandidateLanding'
import type { PublicVotesPagePayload, PublicVoteItem } from '@/shared/api/auditions'

jest.mock('@/shared/api/auditions', () => ({ auditionApi: { bumpApplicationView: jest.fn().mockResolvedValue(undefined) } }))
jest.mock('@/i18n.config', () => ({ Link: ({ children, ...props }: any) => <a {...props}>{children}</a> }))
jest.mock('../VoteInlineVideo', () => ({ VoteInlineVideo: () => <div>Video</div> }))
jest.mock('sonner', () => ({ toast: { message: jest.fn() } }))

const candidate = { applicationId: 'candidate-1', candidateNumber: 3, userName: 'Candidate', voteCount: 2 } as PublicVoteItem
const page = {
  audition: { title: 'Audition' }, roundNumber: 2, votingEnabled: true, voteStatus: 'OPEN',
  voteEndAt: '2026-11-30T13:38:08Z',
} as PublicVotesPagePayload

afterEach(cleanup)

it.each(['ko', 'en', 'mn', 'km', 'uz'])('keeps guest vote intent and the shared round in %s', (locale) => {
  const messages = require(`../../../../messages/${locale}.json`)
  const onVote = jest.fn()
  const onShare = jest.fn()
  const props = { auditionId: 'audition-1', page, shared: candidate, canCast: true, voted: false,
    isGuest: true, voteBusy: false, windowNotice: null, otherRound: false, onVote, onShare }
  const view = render(<NextIntlClientProvider locale={locale} messages={messages}><SharedCandidateLanding {...props} /></NextIntlClientProvider>)
  expect(screen.getByTestId('vote-candidate-number')).toHaveTextContent(messages.vote.candidateNumber.replace('{n}', '3'))
  expect(screen.getByTestId('vote-shared-cast')).toHaveTextContent(messages.vote.voteAction)
  expect(onVote).not.toHaveBeenCalled()
  fireEvent.click(screen.getByTestId('vote-shared-cast'))
  expect(onVote).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByTestId('vote-shared-share'))
  expect(onShare).toHaveBeenCalledTimes(1)
  expect(screen.getByTestId('vote-view-all')).toHaveAttribute('href', '/auditions/audition-1/vote?round=2')
  view.rerender(<NextIntlClientProvider locale={locale} messages={messages}><SharedCandidateLanding {...props} voted /></NextIntlClientProvider>)
  expect(screen.getByTestId('vote-shared-cast')).toBeDisabled()
  view.rerender(<NextIntlClientProvider locale={locale} messages={messages}><SharedCandidateLanding {...props} canCast={false} page={{...page, voteStatus: 'CLOSED'}} /></NextIntlClientProvider>)
  expect(screen.getByTestId('vote-shared-cast')).toBeDisabled()
  expect(onVote).toHaveBeenCalledTimes(1)
})

