import { useCallback, useEffect, useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AUDIENCE_FILTER_OPTIONS } from '../domain/audience'
import { useAudienceCountry } from '../domain/AudienceCountryProvider'
import { colors, radius } from '../theme/tokens'
import { scriptLineHeight } from '../i18n/typography'
import {
  chipFrameFor,
  chipRevealOffset,
  COUNTRY_CHIP_HEIGHT,
  COUNTRY_CHIP_ROW,
  COUNTRY_FILTER_AXIS,
} from './countryFilter/chipLayout'

/**
 * 홈과 오디션 목록이 같은 칩을 쓴다.
 * 높이는 고정하고, 가로 스크롤은 이 필터 줄 안에서만 일어난다.
 * 선택된 칩(예: KH/UZ)이 화면 밖이면 그 칩이 보이도록 스크롤한다.
 * (화면 재마운트·앱 재실행 후 저장된 국가가 복원될 때도 동일)
 */
export function AudienceFilter() {
  const { t, i18n } = useTranslation()
  const { country, selectCountry } = useAudienceCountry()
  const language = i18n.language
  const scrollRef = useRef<ScrollView>(null)
  const chipFrames = useRef<Record<string, { x: number; width: number }>>({})
  const viewportWidth = useRef(0)
  const contentWidth = useRef(0)
  const offset = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * 선택 칩이 밖이면 보이게 스크롤한다.
   * Android 는 첫 레이아웃 직후의 scrollTo 를 무시할 수 있어(앱 재실행·화면 진입 복원 시)
   * 다음 프레임에 스크롤하고, 실제 위치는 onScroll 로만 갱신한 뒤 잠시 후 한 번 더 확인한다.
   */
  const reveal = useCallback(
    (animated: boolean, retry = true) => {
      const frame = chipFrames.current[country]
      if (!frame || viewportWidth.current <= 0 || contentWidth.current <= 0) return
      const next = chipRevealOffset({
        chipX: frame.x,
        chipWidth: frame.width,
        viewportWidth: viewportWidth.current,
        contentWidth: contentWidth.current,
        currentOffset: offset.current,
      })
      if (next == null) return
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: next, y: 0, animated }))
      if (retry) {
        if (retryTimer.current) clearTimeout(retryTimer.current)
        retryTimer.current = setTimeout(() => reveal(false, false), 350)
      }
    },
    [country],
  )

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current)
  }, [])

  // 선택이 바뀌면 그 칩을 보이게 한다. 레이아웃이 아직이면 onLayout 에서 처리.
  const lastCountry = useRef<string | null>(null)
  useEffect(() => {
    const changed = lastCountry.current !== null && lastCountry.current !== country
    lastCountry.current = country
    reveal(changed)
  }, [country, language, reveal])

  const onChipLayout = useCallback(
    (option: string, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout
      chipFrames.current[option] = { x, width }
      if (option === country) reveal(false)
    },
    [country, reveal],
  )

  return (
    <View style={styles.wrap}>
      <View style={styles.clip}>
        <ScrollView
          ref={scrollRef}
          horizontal={COUNTRY_FILTER_AXIS === 'horizontal'}
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
          contentContainerStyle={styles.row}
          scrollEventThrottle={32}
          onScroll={(e) => {
            offset.current = e.nativeEvent.contentOffset.x
          }}
          onLayout={(e) => {
            viewportWidth.current = e.nativeEvent.layout.width
            reveal(false)
          }}
          onContentSizeChange={(w) => {
            contentWidth.current = w
            reveal(false)
          }}
        >
          {AUDIENCE_FILTER_OPTIONS.map((option) => {
            const selected = country === option
            const label = option === 'ALL' ? t('auditions.filterAll') : t(`country.${option}`)
            return (
              <CountryFilterChip
                key={option}
                option={option}
                label={label}
                selected={selected}
                lineHeight={scriptLineHeight(language, 14, 18)}
                onLayout={(e) => onChipLayout(option, e)}
                onPress={() => {
                  // 이미 선택된 칩을 다시 누르면 국가는 그대로(재요청 없음) 두고, 일부만 보이면 전부 보이게 스크롤한다.
                  if (option === country) reveal(true)
                  selectCountry(option)
                }}
              />
            )
          })}
        </ScrollView>
      </View>
      <Text style={[styles.hint, { lineHeight: scriptLineHeight(language, 13, 18) }]}>{t('auditions.filterHint')}</Text>
    </View>
  )
}

function CountryFilterChip({
  option,
  label,
  selected,
  lineHeight,
  onLayout,
  onPress,
}: {
  option: string
  label: string
  selected: boolean
  lineHeight: number
  onLayout: (e: LayoutChangeEvent) => void
  onPress: () => void
}) {
  const frame = chipFrameFor(option)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      onLayout={onLayout}
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.chip, { height: frame.height, paddingHorizontal: frame.paddingHorizontal }, selected && styles.chipOn]}
    >
      <Text numberOfLines={1} style={[styles.chipLabel, { lineHeight }, selected && styles.chipLabelOn]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12, alignSelf: 'stretch', maxWidth: '100%' },
  clip: { alignSelf: 'stretch', width: '100%', overflow: 'hidden' },
  scroller: { flexGrow: 0, height: COUNTRY_CHIP_HEIGHT },
  row: { ...COUNTRY_CHIP_ROW, gap: 8 },
  chip: {
    flexShrink: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  chipLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipLabelOn: { color: '#ffffff' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
})
