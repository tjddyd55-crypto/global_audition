import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApplicantStar, useApplicantShortlist } from '../useApplicantShortlist'
import { apiClient } from '@/shared/api/client'
import { toast } from 'sonner'

jest.mock('@/shared/api/client', () => ({ apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }))
jest.mock('@/shared/auth/authStore', () => ({ useAuthStore: (select: (s: {userId:string})=>unknown) => select({ userId: 'reviewer' }) }))
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }))
const get = apiClient.get as jest.Mock
const post = apiClient.post as jest.Mock
function View({ label }: { label: string }) {
  const s = useApplicantShortlist('audition', 5)
  const saved = s.entries.some(x => x.applicationId === 'application')
  return <div aria-label={label}><ApplicantStar saved={saved} disabled={s.pending} onClick={() => s.change(['application'], !saved)} /><span>{s.entries.length}</span></div>
}
beforeEach(() => { jest.clearAllMocks(); get.mockResolvedValue({ data: [] }) })
test('optimistic stars synchronize between list/detail and roll back failed saves', async () => {
  let reject!: (reason: Error) => void
  post.mockImplementation(() => new Promise((_resolve, fail) => { reject = fail }))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><View label="list" /><View label="detail" /></QueryClientProvider>)
  await waitFor(() => expect(get).toHaveBeenCalled())
  fireEvent.click(screen.getAllByRole('button', { name: '관심 지원자 등록' })[0])
  await waitFor(() => expect(screen.getAllByRole('button', { name: '관심 지원자 해제' })).toHaveLength(2))
  expect(post).toHaveBeenCalledWith('/auditions/audition/applications/shortlist', { applicationIds: ['application'], saved: true }, { params: { round: 5 } })
  reject(new Error('offline'))
  await waitFor(() => expect(screen.getAllByRole('button', { name: '관심 지원자 등록' })).toHaveLength(2))
  expect(toast.error).toHaveBeenCalled()
  client.clear()
})
