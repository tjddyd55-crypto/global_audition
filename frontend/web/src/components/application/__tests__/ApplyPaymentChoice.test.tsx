import { act, renderHook } from '@testing-library/react'
import { useApplyPayment } from '../ApplyPaymentChoice'
import { usePointQuote } from '@/shared/audition/usePointQuote'
import type { PointQuote } from '@/shared/audition/points'

jest.mock('@/shared/audition/usePointQuote', () => ({ usePointQuote: jest.fn() }))

test('a point choice cannot silently become a credit charge when the point policy changes', () => {
  let quote: PointQuote | undefined = { creditBalance: 10, creditCost: 3, pointBalance: 3000, pointCost: 3000, pointAllowed: true }
  ;(usePointQuote as jest.Mock).mockImplementation(() => ({ data: quote }))
  const view = renderHook(() => useApplyPayment(true))
  expect(view.result.current.disabled).toBe(true)
  act(() => view.result.current.select('POINT'))
  expect(view.result.current.payload).toEqual({paymentMethod:'POINT',expectedPointCost:3000})
  expect(view.result.current.disabled).toBe(false)
  quote = {...quote!, pointAllowed: false}
  view.rerender()
  expect(view.result.current.disabled).toBe(true)
  expect(view.result.current.payload.paymentMethod).toBe('POINT')
  quote = undefined
  view.rerender()
  expect(view.result.current.disabled).toBe(true)
})
