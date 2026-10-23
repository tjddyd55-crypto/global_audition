import { UPLOAD_ERROR } from '@/shared/api/uploadErrorCodes'
import { AUDITION_IMAGE_ERROR } from '@/shared/audition/auditionImageRules'
import ko from '../../../../messages/ko.json'
import { bindCatalogTranslator, mapDisplayError } from '../mapDisplayError'

function translateFromKo(key: string): string {
  const [ns, name] = key.split('.')
  const tree = ko as Record<string, Record<string, string>>
  return tree[ns]?.[name] ?? key
}

describe('mapDisplayError', () => {
  const translate = bindCatalogTranslator({
    uploader: (key) => translateFromKo(`uploader.${key}`),
    errors: (key) => translateFromKo(`errors.${key}`),
  })

  it('maps upload timeout codes to catalog copy', () => {
    expect(mapDisplayError(new Error(UPLOAD_ERROR.TIMEOUT), translate, 'fallback')).toBe(ko.uploader.timeout)
  })

  it('maps image type codes to catalog copy', () => {
    expect(mapDisplayError(new Error(AUDITION_IMAGE_ERROR.INVALID_TYPE), translate, 'fallback')).toBe(
      ko.uploader.invalidType,
    )
  })

  it('falls back when the error is unknown', () => {
    expect(mapDisplayError(new Error('UNKNOWN_CODE'), translate, 'fallback')).toBe('fallback')
  })
})
