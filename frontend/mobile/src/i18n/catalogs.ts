import { deepMergeMessages } from '../../../web/src/shared/i18n/mergeMessages'

type MessageTree = Record<string, unknown>

export type NativeCatalogResources = {
  ko: { translation: MessageTree }
  en: { translation: MessageTree }
  mn: { translation: MessageTree }
}

/** 네이티브도 웹과 같이 en을 바닥에 깔아 누락 키가 원문 키로 보이지 않게 한다. */
export function nativeTranslationResources(
  english: MessageTree,
  korean: MessageTree,
  mongolian: MessageTree,
): NativeCatalogResources {
  return {
    ko: { translation: deepMergeMessages(english, korean) },
    en: { translation: english },
    mn: { translation: deepMergeMessages(english, mongolian) },
  }
}
