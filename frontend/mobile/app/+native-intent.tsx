import { WEB_URL } from '../src/config/env'
import { publicAppLink } from '../src/domain/publicAppLink'

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return publicAppLink(path, WEB_URL)
}
