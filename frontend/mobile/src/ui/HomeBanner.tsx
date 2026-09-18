import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius, space, touch } from '../theme/tokens'

type Props = {
  onPress: () => void
}

export function HomeBanner({ onPress }: Props) {
  const { t } = useTranslation()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.bannerCta')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('home.bannerTitle')}</Text>
          <Text style={styles.body}>{t('home.bannerBody')}</Text>
          <Text style={styles.cta}>{t('home.bannerCta')} →</Text>
        </View>
        <View style={styles.iconWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="sparkles-outline" size={28} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.lg,
    borderRadius: radius.card + 2,
    overflow: 'hidden',
    minHeight: 120,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    gap: space.sm,
    minHeight: touch.min * 2 + space.sm,
  },
  copy: { flex: 1, gap: 4, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 22 },
  body: { fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 18 },
  cta: { marginTop: space.xs, fontSize: 13, fontWeight: '700', color: '#fff' },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pressed: { opacity: 0.92 },
})
