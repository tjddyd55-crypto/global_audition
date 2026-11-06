import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  TAB_LABEL_FONT_SIZE,
  TAB_LABEL_LINES,
  TAB_LABEL_MIN_SCALE,
  type NativeTabIcon,
} from './nativeTabItems'

const FRAME = 22
const STROKE = 1.8

/**
 * 탭 아이콘. 라벨 문자열을 받지 않는다.
 * 색만 활성/비활성에 맞추고, 도형은 웹 하단 탭과 같은 선 아이콘이다.
 */
export function TabIcon({ icon, color }: { icon: NativeTabIcon; color: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.frame}
    >
      {GLYPHS[icon](color)}
    </View>
  )
}

export function TabLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text
      numberOfLines={TAB_LABEL_LINES}
      adjustsFontSizeToFit
      minimumFontScale={TAB_LABEL_MIN_SCALE}
      allowFontScaling={false}
      android_hyphenationFrequency="none"
      textBreakStrategy="simple"
      style={[styles.label, { color, fontSize: TAB_LABEL_FONT_SIZE }]}
    >
      {label}
    </Text>
  )
}

const GLYPHS: Record<NativeTabIcon, (color: string) => ReactNode> = {
  home: (color) => <HomeGlyph color={color} />,
  film: (color) => <FilmGlyph color={color} />,
  star: (color) => <VoteGlyph color={color} />,
  list: (color) => <ListGlyph color={color} />,
  person: (color) => <ProfileGlyph color={color} />,
}

function HomeGlyph({ color }: { color: string }) {
  return (
    <>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.house, { borderColor: color }]} />
    </>
  )
}

function FilmGlyph({ color }: { color: string }) {
  return (
    <View style={[styles.screen, { borderColor: color }]}>
      <View style={[styles.play, { borderLeftColor: color }]} />
    </View>
  )
}

function VoteGlyph({ color }: { color: string }) {
  return (
    <View style={[styles.voteRing, { borderColor: color }]}>
      <View style={[styles.voteCheck, { borderColor: color }]} />
    </View>
  )
}

function ListGlyph({ color }: { color: string }) {
  return (
    <View style={styles.list}>
      <View style={[styles.listLine, styles.listLineLong, { backgroundColor: color }]} />
      <View style={[styles.listLine, styles.listLineShort, { backgroundColor: color }]} />
      <View style={[styles.listLine, styles.listLineLong, { backgroundColor: color }]} />
    </View>
  )
}

function ProfileGlyph({ color }: { color: string }) {
  return (
    <>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </>
  )
}

const styles = StyleSheet.create({
  frame: {
    width: FRAME,
    height: FRAME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 2,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  house: {
    width: 12,
    height: 9,
    borderWidth: STROKE,
    borderTopWidth: 0,
  },
  screen: {
    width: 16,
    height: 12,
    borderWidth: STROKE,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 0,
    height: 0,
    marginLeft: 2,
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  voteRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: STROKE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCheck: {
    width: 7,
    height: 4,
    marginTop: -2,
    borderLeftWidth: STROKE,
    borderBottomWidth: STROKE,
    transform: [{ rotate: '-45deg' }],
  },
  list: { alignItems: 'flex-start', justifyContent: 'center' },
  listLine: { height: STROKE, borderRadius: 1, marginVertical: 1.5 },
  listLineLong: { width: 16 },
  listLineShort: { width: 11 },
  head: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: STROKE,
    marginBottom: 1,
  },
  shoulders: {
    width: 14,
    height: 6,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: STROKE,
    borderBottomWidth: 0,
  },
})
