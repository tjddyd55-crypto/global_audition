/**
 * 하단 탭은 라우트마다 라벨 키 하나, 아이콘 키 하나만 가진다.
 * 글자는 라벨 슬롯에서만 그리고, 아이콘 슬롯은 도형만 그린다.
 */
export const NATIVE_TAB_ITEMS = {
  index: { labelKey: 'nav.home', icon: 'home' },
  auditions: { labelKey: 'nav.auditions', icon: 'film' },
  vote: { labelKey: 'nav.vote', icon: 'star' },
  applications: { labelKey: 'nav.applications', icon: 'list' },
  profile: { labelKey: 'nav.profile', icon: 'person' },
} as const

export type NativeTabRoute = keyof typeof NATIVE_TAB_ITEMS
export type NativeTabIcon = (typeof NATIVE_TAB_ITEMS)[NativeTabRoute]['icon']

export const TAB_LABEL_FONT_SIZE = 11
export const TAB_LABEL_LINES = 1
/** 글자를 줄여 읽기 어렵게 만들지 않는다. 긴 이름은 짧은 번역을 보인다. */
export const TAB_LABEL_MIN_SCALE = 1

export type TabChrome = {
  route: NativeTabRoute
  labelKey: string
  visibleLabelKey: string
  icon: NativeTabIcon
  labelSlots: 1
  numberOfLines: typeof TAB_LABEL_LINES
  adjustsFontSizeToFit: true
  fontSize: typeof TAB_LABEL_FONT_SIZE
  minimumFontScale: typeof TAB_LABEL_MIN_SCALE
}

/** 화면에 보이는 탭 이름. 내 지원만 이미 있는 짧은 번역을 쓴다. */
export function tabVisibleLabelKey(route: NativeTabRoute): string {
  if (route === 'applications') return 'common.applications'
  return NATIVE_TAB_ITEMS[route].labelKey
}

/** 스크린 리더용 전체 이름. 보이는 글자와 달라도 한 번만 읽는다. */
export function tabAccessibleLabelKey(route: NativeTabRoute): string {
  return NATIVE_TAB_ITEMS[route].labelKey
}

export function tabChrome(route: NativeTabRoute): TabChrome {
  const item = NATIVE_TAB_ITEMS[route]
  return {
    route,
    labelKey: item.labelKey,
    visibleLabelKey: tabVisibleLabelKey(route),
    icon: item.icon,
    labelSlots: 1,
    numberOfLines: TAB_LABEL_LINES,
    adjustsFontSizeToFit: true,
    fontSize: TAB_LABEL_FONT_SIZE,
    minimumFontScale: TAB_LABEL_MIN_SCALE,
  }
}

export function isSingleLineLabel(label: string): boolean {
  return label.trim().length > 0 && label === label.trim() && !/[\r\n]/.test(label)
}
