import { safeNextPath, withNext } from '../safeNext'

describe('safeNextPath', () => {
  it('keeps internal paths with query', () => {
    expect(safeNextPath('/auditions/a/vote?round=3&candidate=b')).toBe('/auditions/a/vote?round=3&candidate=b')
  })
  it('rejects external targets', () => {
    expect(safeNextPath('https://evil.example')).toBeNull()
    expect(safeNextPath('//evil.example')).toBeNull()
    expect(safeNextPath('/\\evil.example')).toBeNull()
    expect(safeNextPath(null)).toBeNull()
  })
  it('passes next to register', () => {
    expect(withNext('/register', '/a?b=1')).toBe('/register?next=%2Fa%3Fb%3D1')
    expect(withNext('/register', null)).toBe('/register')
  })
})
