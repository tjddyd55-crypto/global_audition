/**
 * 생년월일(YYYY-MM-DD) 기준 만 나이. 브라우저 로컬 달력 기준(서버 검증은 Asia/Seoul).
 */
export function calculateAge(birthDateYmd: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateYmd)) {
    return null
  }
  const [ys, ms, ds] = birthDateYmd.split('-').map((x) => Number(x))
  const birth = new Date(ys, ms - 1, ds)
  if (Number.isNaN(birth.getTime())) {
    return null
  }
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
