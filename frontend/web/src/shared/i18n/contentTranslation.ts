export type ContentTranslationView = {
  fields?: Record<string, string>
  showingOriginal?: boolean
  stale?: boolean
  fallback?: boolean
  sourceLocale?: string | null
  errorCode?: string | null
}

export function displayedField(
  original: string | null | undefined,
  view: ContentTranslationView | null | undefined,
  field: string,
  forceOriginal: boolean,
): string {
  const source = original ?? ''
  if (forceOriginal || !view || view.showingOriginal) return source
  const translated = view.fields?.[field]
  if (translated && translated.trim()) return translated
  return source
}

export function translationNotice(
  view: ContentTranslationView | null | undefined,
  forceOriginal: boolean,
): 'original' | 'stale' | null {
  if (!view) return null
  if (forceOriginal || view.showingOriginal || view.fallback) return 'original'
  if (view.stale) return 'stale'
  return null
}
