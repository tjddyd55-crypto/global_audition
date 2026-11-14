import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { persistLocale } from './LocaleProvider'
import { PUBLIC_SELECTOR, getRuntimeLocale, nativeLanguageName } from './runtime'
import { scriptLineHeight } from './typography'
import { colors, radius } from '../theme/tokens'

/** 헤더 높이(안드로이드 기본 56dp) 바로 아래에 메뉴를 띄운다. */
const HEADER_HEIGHT = 56

/**
 * 공통 언어 선택.
 * 헤더 오른쪽에 `한국어 ▾` 처럼 현재 언어만 보이고, 누르면 5개 언어가 세로 목록으로 열린다.
 * 선택 즉시 i18n 언어가 바뀌고 SecureStore 에 저장되어 재실행 후에도 유지된다.
 * 모집 국가 필터(AudienceCountryProvider)와는 별개 상태다. 언어를 바꿔도 국가 필터는 그대로다.
 */
export function LanguageMenu({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const active = PUBLIC_SELECTOR.includes(i18n.language) ? i18n.language : getRuntimeLocale()

  const choose = (code: string) => {
    setOpen(false)
    if (code !== active) void persistLocale(code)
  }

  return (
    <View style={[styles.anchor, !compact && styles.anchorWide]}>
      {!compact ? <Text style={styles.caption}>{t('profile.language')}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.language')}
        accessibilityHint={nativeLanguageName(active)}
        accessibilityState={{ expanded: open }}
        testID="language-menu-toggle"
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
      >
        <Text
          numberOfLines={1}
          style={[styles.toggleText, { lineHeight: scriptLineHeight(active, 14, 18) }]}
        >
          {nativeLanguageName(active)}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          testID="language-menu-backdrop"
          accessibilityLabel={t('common.close')}
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          <View
            accessibilityRole="menu"
            style={[styles.menu, { top: insets.top + HEADER_HEIGHT - 6, right: Math.max(insets.right, 0) + 10 }]}
          >
            {PUBLIC_SELECTOR.map((code) => {
              const selected = active === code
              return (
                <Pressable
                  key={code}
                  testID={`language-option-${code}`}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => choose(code)}
                  style={({ pressed }) => [styles.item, selected && styles.itemOn, pressed && styles.itemPressed]}
                >
                  <Text
                    style={[
                      styles.itemText,
                      selected && styles.itemTextOn,
                      { lineHeight: scriptLineHeight(code, 15, 20) },
                    ]}
                  >
                    {nativeLanguageName(code)}
                  </Text>
                  <Text style={[styles.check, !selected && styles.checkHidden]}>✓</Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  anchor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 4 },
  anchorWide: { gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  caption: { fontSize: 12, color: colors.faint },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
  },
  togglePressed: { backgroundColor: colors.heroStart },
  toggleText: { fontSize: 14, fontWeight: '700', color: colors.text, maxWidth: 120 },
  caret: { fontSize: 12, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.12)' },
  menu: {
    position: 'absolute',
    minWidth: 180,
    paddingVertical: 6,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemOn: { backgroundColor: colors.heroStart },
  itemPressed: { backgroundColor: '#f3f4f6' },
  itemText: { fontSize: 15, color: colors.text },
  itemTextOn: { color: colors.purple, fontWeight: '700' },
  check: { fontSize: 15, fontWeight: '700', color: colors.purple },
  checkHidden: { opacity: 0 },
})
