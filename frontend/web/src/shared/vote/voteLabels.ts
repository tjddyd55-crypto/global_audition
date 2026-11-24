/**
 * 영어만 단수(vote)와 복수(votes)를 가른다.
 * ko/mn/km/uz 는 수가 바뀌어도 같은 형태를 쓴다.
 */
export function usesEnglishVotePlural(locale?: string | null): boolean {
  return (locale || '').split('-')[0] === 'en'
}

export function voteLabelKey(n: number, locale: string | null | undefined, manyKey: string, oneKey: string): string {
  return usesEnglishVotePlural(locale) && n === 1 ? oneKey : manyKey
}
