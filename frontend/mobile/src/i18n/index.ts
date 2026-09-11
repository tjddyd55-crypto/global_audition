import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from '../../../web/messages/ko.json'
import en from '../../../web/messages/en.json'
import mn from '../../../web/messages/mn.json'
import ja from '../../../web/messages/ja.json'
import zh from '../../../web/messages/zh.json'
import es from '../../../web/messages/es.json'
import fr from '../../../web/messages/fr.json'
import de from '../../../web/messages/de.json'
import { DEFAULT_LOCALE, DEVICE_FALLBACK } from './runtime'

void i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    mn: { translation: mn },
    ja: { translation: ja },
    zh: { translation: zh },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEVICE_FALLBACK,
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
  returnNull: false,
})

export default i18n
