import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('audition edit original load', () => {
  it('uses a query key separate from the public audition detail', () => {
    const source = readFileSync(
      resolve(__dirname, '../../../app/[locale]/auditions/[id]/edit/page.tsx'),
      'utf8',
    )
    expect(source).toContain("['audition-original', id]")
    expect(source).toContain('getOriginal')
    expect(source).not.toContain("queryKey: ['audition', id]")
  })
})
