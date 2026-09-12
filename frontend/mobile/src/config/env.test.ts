import { isLoopbackApiUrl } from './envUrl'

describe('API URL', () => {
  it('flags localhost trap for real Android', () => {
    expect(isLoopbackApiUrl('http://localhost:8080/api')).toBe(true)
    expect(isLoopbackApiUrl('http://127.0.0.1:8080/api')).toBe(true)
    expect(isLoopbackApiUrl('https://frontend-develop-3d3e.up.railway.app/api')).toBe(false)
    expect(isLoopbackApiUrl('http://10.0.2.2:3000/api')).toBe(false)
  })
})
