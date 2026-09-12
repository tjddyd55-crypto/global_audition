/** Backend category chip sentinel. Display copy must come from the catalog. */
export const ALL_CATEGORY_SENTINEL = '전체'

export function isAllCategoryName(name: string, localizedAll?: string): boolean {
  if (name === ALL_CATEGORY_SENTINEL) return true
  return localizedAll != null && localizedAll.length > 0 && name === localizedAll
}
