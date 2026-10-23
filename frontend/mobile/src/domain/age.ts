/**
 * 웹 calculateAge와 동일한 만 나이 계산.
 * 서버 최종 검증은 Asia/Seoul 기준 ApplicationBirthdates.
 */
export function calculateAge(birthDateYmd: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateYmd)) return null
  const [year, month, day] = birthDateYmd.split('-').map((part) => Number(part))
  const birth = new Date(year, month - 1, day)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}
