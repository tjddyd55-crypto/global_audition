import { heroContrast } from '../heroContrast'

describe('heroContrast', () => {
  it('keeps white type on a real poster', () => {
    const onPhoto = heroContrast(true)
    expect(onPhoto.title).toContain('text-white')
    expect(onPhoto.overlay).toContain('from-black/70')
  })

  it('uses dark type and the violet brand when there is no poster', () => {
    const plain = heroContrast(false)
    expect(plain.title).toContain('text-neutral-950')
    expect(plain.title).not.toContain('text-white')
    expect(plain.emptyLabel).toContain('text-violet-800')
    expect(plain.tag).toContain('violet')
    expect(plain.overlay).not.toContain('text-white')
  })
})
