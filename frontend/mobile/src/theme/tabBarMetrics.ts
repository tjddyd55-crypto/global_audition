import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { space, tabBar } from './tokens'

/** Figma visual tab bar band (icon + label). System inset is added below this. */
export const TAB_BAR_VISUAL_HEIGHT = tabBar.height

const TAB_BAR_PADDING_TOP = 6
/** Fallback when runtime bottom inset is 0 (e.g. hidden nav bar). */
const TAB_BAR_MIN_BOTTOM_PADDING = space.xs

/**
 * Bottom tab shell metrics shared by Tabs layout and tab-root screens.
 * Total height = visual 72px + runtime bottom inset (gesture bar / 3-button nav).
 */
export function useTabBarMetrics() {
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING)
  const totalHeight = TAB_BAR_VISUAL_HEIGHT + bottomInset

  return {
    visualHeight: TAB_BAR_VISUAL_HEIGHT,
    bottomInset: insets.bottom,
    paddingTop: TAB_BAR_PADDING_TOP,
    paddingBottom: bottomInset,
    totalHeight,
    /** Extra scroll end gap on tab-root screens (tab bar is a sibling, not overlay). */
    scrollContentPaddingBottom: space.lg,
  }
}

/** Tab bar layout fields for React Navigation `tabBarStyle` (merge colors in layout). */
export function tabBarLayoutStyle(metrics: ReturnType<typeof useTabBarMetrics>) {
  return {
    height: metrics.totalHeight,
    minHeight: metrics.totalHeight,
    paddingTop: metrics.paddingTop,
    paddingBottom: metrics.paddingBottom,
  }
}
