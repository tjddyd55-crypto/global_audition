import { useCallback, useEffect, useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../theme/tokens'
import { scriptLineHeight } from '../i18n/typography'
import {
  chipFrameFor,
  chipRevealOffset,
  COUNTRY_CHIP_HEIGHT,
  COUNTRY_CHIP_ROW,
  COUNTRY_FILTER_AXIS,
} from './countryFilter/chipLayout'

export type ScrollChipRowProps = {
  options: readonly string[]
  selected: string
  onSelect: (option: string) => void
  labelOf: (option: string) => string
  accessibilityLabel?: string
  testID?: string
}

/**
 * 가로 스크롤 칩 줄(높이 고정). 선택 칩이 화면 밖이면 보이도록 스크롤한다.
 * Android 는 첫 레이아웃 직후 scrollTo 를 무시할 수 있어 다음 프레임 + 350ms 후 한 번 더 확인한다.
 * 국가 필터(AudienceFilter)와 채널 국가/분야 필터가 같은 동작을 쓴다.
 */
export function ScrollChipRow({ options, selected, onSelect, labelOf, accessibilityLabel, testID }: ScrollChipRowProps) {
  const { i18n } = useTranslation()
  const language = i18n.language
  const scrollRef = useRef<ScrollView>(null)
  const chipFrames = useRef<Record<string, { x: number; width: number }>>({})
  const viewportWidth = useRef(0)
  const contentWidth = useRef(0)
  const offset = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reveal = useCallback(
    (animated: boolean, retry = true) => {
      const frame = chipFrames.current[selected]
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
    [selected],
  )

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current)
  }, [])

  const lastSelected = useRef<string | null>(null)
  useEffect(() => {
    const changed = lastSelected.current !== null && lastSelected.current !== selected
    lastSelected.current = selected
    reveal(changed)
  }, [selected, language, reveal])

  const onChipLayout = useCallback(
    (option: string, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout
      chipFrames.current[option] = { x, width }
      if (option === selected) reveal(false)
    },
    [selected, reveal],
  )

  return (
    <View style={styles.clip} testID={testID} accessibilityLabel={accessibilityLabel}>
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
        {options.map((option) => {
          const on = selected === option
          const label = labelOf(option)
          const frame = chipFrameFor(option)
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              onLayout={(e) => onChipLayout(option, e)}
              hitSlop={{ top: 4, bottom: 4 }}
              onPress={() => {
                // 이미 선택된 칩을 다시 누르면 값은 그대로 두고, 일부만 보이면 전부 보이게 스크롤한다.
                if (option === selected) reveal(true)
                onSelect(option)
              }}
              style={[styles.chip, { height: frame.height, paddingHorizontal: frame.paddingHorizontal }, on && styles.chipOn]}
            >
              <Text numberOfLines={1} style={[styles.chipLabel, { lineHeight: scriptLineHeight(language, 14, 18) }, on && styles.chipLabelOn]}>
                {label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
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
  chipOn: { backgroundColor: colors.purple, borderColor: colors.purple },
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
})
