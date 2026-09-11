import { isLoopbackApiUrl } from './envUrl'

describe('API URL', () => {
  it('flags localhost trap for real Android', () => {
    expect(isLoopbackApiUrl('http://localhost:8080/api')).toBe(true)
    expect(isLoopbackApiUrl('http://127.0.0.1:8080/api')).toBe(true)
    expect(isLoopbackApiUrl('https://frontend-production-8613a.up.railway.app/api')).toBe(false)
    expect(isLoopbackApiUrl('http://10.0.2.2:3000/api')).toBe(false)
  })
})
