import { StyleSheet } from 'react-native'

/** 360px급 좁은 화면에서 텍스트·행 레이아웃이 깨지지 않도록 공통 shrink 규칙. */
export const narrow = StyleSheet.create({
  shrink: { minWidth: 0, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
