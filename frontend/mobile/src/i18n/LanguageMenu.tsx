import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { persistLocale } from './LocaleProvider'
import { PUBLIC_SELECTOR, getRuntimeLocale } from './runtime'
import { colors } from '../theme/tokens'

export function LanguageMenu() {
  const { t, i18n } = useTranslation()
  const active = PUBLIC_SELECTOR.includes(i18n.language) ? i18n.language : getRuntimeLocale()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ fontSize: 12, color: colors.faint }}>{t('profile.language')}</Text>
      {PUBLIC_SELECTOR.map((code) => {
        const selected = active === code
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => void persistLocale(code)}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: selected ? colors.purple : 'transparent',
              borderWidth: 1,
              borderColor: selected ? colors.purple : colors.faint,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: selected ? '#fff' : colors.faint }}>
              {t(`locale.${code}`)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
