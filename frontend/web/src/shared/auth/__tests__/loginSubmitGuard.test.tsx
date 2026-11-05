import { TextEncoder } from 'util'
import { act, renderHook } from '@testing-library/react'
import { useLoginSubmitGuard } from '../loginSubmitGuard'

function Btn() {
  const g = useLoginSubmitGuard()
  return <button type="submit" disabled={!g.hydrated} />
}

Object.assign(globalThis, { TextEncoder })
// react-dom/server 는 TextEncoder 필요(jsdom 미제공) → 폴리필 후 로드
const { renderToString } = require('react-dom/server')

describe('useLoginSubmitGuard', () => {
  it('SSR(하이드레이션 전) HTML 에서는 제출 버튼이 disabled → 기본 GET 제출(비밀번호 URL 노출) 불가', () => {
    expect(renderToString(<Btn />)).toContain('disabled')
  })

  it('하이드레이션 후 hydrated=true', () => {
    const { result } = renderHook(() => useLoginSubmitGuard())
    expect(result.current.hydrated).toBe(true)
  })

  it('동시 더블 제출은 한 번만 허용, end 후 재시도 가능', () => {
    const { result } = renderHook(() => useLoginSubmitGuard())
    let a = false, b = false, c = false
    act(() => {
      a = result.current.tryBegin()
      b = result.current.tryBegin()
    })
    expect(a).toBe(true)
    expect(b).toBe(false)
    act(() => {
      result.current.end()
      c = result.current.tryBegin()
    })
    expect(c).toBe(true)
  })
})
