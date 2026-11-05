import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGES = [
  'src/app/[locale]/auditions/[id]/edit/page.tsx',
  'src/app/[locale]/auditions/create/page.tsx',
  'src/app/[locale]/auditions/new/page.tsx',
  'src/app/[locale]/dashboard/auditions/create/page.tsx',
]

const ROOT = resolve(__dirname, '../../../../')

describe('audition create and edit navigation', () => {
  it('uses the locale-aware router for save, cancel, and back', () => {
    for (const rel of PAGES) {
      const source = readFileSync(resolve(ROOT, rel), 'utf8')
      expect(source).not.toMatch(/import\s*\{[^}]*\buseRouter\b[^}]*\}\s*from\s*['"]next\/navigation['"]/)
      expect(source).not.toMatch(/<a[\s>/]/)
      expect(source).not.toMatch(/['"`]\/en(?:\/|['"`])/)
      if (source.includes('useRouter')) {
        expect(source).toMatch(/i18n\.config/)
      }
      if (source.includes('href=')) {
        expect(source).toMatch(/Link/)
      }
    }
  })
})
