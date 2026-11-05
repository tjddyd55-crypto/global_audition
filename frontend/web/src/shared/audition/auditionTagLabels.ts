/**
 * 미리 정의된 카테고리 태그는 저장값(한글 이름)을 바꾸지 않고 카탈로그 키로만 표시한다.
 * 사용자가 만든 자유 태그는 선택 로케일 번역이 있을 때만 바꾸고, 없으면 원문을 보여 준다.
 * 검색·필터는 tagId 또는 저장된 name 을 쓴다.
 */

const STORED_CATALOG_KEY: Record<string, string> = {
  보컬: 'VOCAL',
  댄서: 'DANCE',
  팀: 'TEAM',
  배우: 'ACTING',
  모델: 'MODEL',
}

export function auditionTagCatalogKey(stored: string): string | null {
  const key = STORED_CATALOG_KEY[(stored ?? '').trim()]
  return key ?? null
}

export function displayAuditionTag(
  stored: string,
  translateCatalog: (key: string) => string,
  contentFields?: Record<string, string> | null,
  showOriginal = false,
): string {
  const source = (stored ?? '').trim()
  const catalogKey = auditionTagCatalogKey(source)
  if (catalogKey) return translateCatalog(catalogKey)
  if (!showOriginal) {
    const translated = contentFields?.[`tag:${source}`]?.trim()
    if (translated) return translated
  }
  return source
}

export function tagFilterToken(ref: { tagId?: string | null; name: string }): string {
  const id = ref.tagId?.trim()
  if (id) return id
  return ref.name
}
