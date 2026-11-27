const UUID = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'
const DIRECT = new RegExp(`^/(applications|auditions|casting)/${UUID}$`, 'i')
const WEB_CASTING = new RegExp(`^/my/studio/casting/(${UUID})$`, 'i')

export function pushDestination(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (DIRECT.test(value)) return value
  const casting = WEB_CASTING.exec(value)
  return casting ? `/casting/${casting[1]}` : undefined
}
