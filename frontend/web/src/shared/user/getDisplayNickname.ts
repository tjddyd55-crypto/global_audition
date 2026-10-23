/** Public display name. Nickname is the SSOT; other fields are migration fallbacks. */
export function getDisplayNickname(
  user: {
    nickname?: string | null
    /** Backend `/auth/me` name field */
    name?: string | null
    legalName?: string | null
    email?: string | null
    displayName?: string | null
  },
  fallback: string,
): string {
  const nick = user.nickname?.trim()
  if (nick) return nick
  const dn = user.displayName?.trim()
  if (dn) return dn
  const legal = user.legalName?.trim() || user.name?.trim()
  if (legal) return legal
  const em = user.email?.trim()
  if (em) {
    const at = em.indexOf('@')
    if (at > 0) return em.slice(0, at)
  }
  return fallback
}
