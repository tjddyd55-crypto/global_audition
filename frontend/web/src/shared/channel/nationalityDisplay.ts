/** 공개 채널 등 UI용 국적 라벨 (API 코드: KR | MN | JP | OTHER) */
export function nationalityLabelKo(code: string | null | undefined): string | null {
  const c = (code ?? '').trim().toUpperCase()
  if (!c) return null
  const map: Record<string, string> = {
    KR: '🇰🇷 대한민국',
    MN: '🇲🇳 몽골',
    JP: '🇯🇵 일본',
    OTHER: '기타',
  }
  return map[c] ?? null
}
