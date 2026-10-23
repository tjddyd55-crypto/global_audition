import i18n, { use as registerI18nPlugin } from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from '../../../web/messages/ko.json'
import en from '../../../web/messages/en.json'
import mn from '../../../web/messages/mn.json'
import { nativeTranslationResources } from './catalogs'
import { DEFAULT_LOCALE, DEVICE_FALLBACK, PRIMARY_LOCALES } from './runtime'

const resources = nativeTranslationResources(
  en as Record<string, unknown>,
  ko as Record<string, unknown>,
  mn as Record<string, unknown>,
)

void registerI18nPlugin.call(i18n, initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEVICE_FALLBACK,
  supportedLngs: [...PRIMARY_LOCALES],
  nonExplicitSupportedLngs: true,
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
  returnNull: false,
})

export default i18n
