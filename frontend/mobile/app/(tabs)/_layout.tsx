import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LanguageMenu } from '../../src/i18n/LanguageMenu'
import { colors } from '../../src/theme/tokens'
import { TabIcon, TabLabel } from '../../src/ui/tabs/TabChrome'
import {
  NATIVE_TAB_ITEMS,
  tabAccessibleLabelKey,
  tabVisibleLabelKey,
  type NativeTabRoute,
} from '../../src/ui/tabs/nativeTabItems'

/**
 * 아이콘 슬롯과 라벨 슬롯을 분리한다.
 * 보이는 이름은 하나이고, 스크린 리더는 전체 번역을 읽는다.
 */
function tabOptions(route: NativeTabRoute, visible: string, accessible: string) {
  const { icon } = NATIVE_TAB_ITEMS[route]
  return {
    title: accessible,
    tabBarAccessibilityLabel: accessible,
    tabBarIcon: ({ color }: { color: string }) => <TabIcon icon={icon} color={color} />,
    tabBarLabel: ({ color }: { color: string }) => <TabLabel label={visible} color={color} />,
  }
}

export default function TabsLayout() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerRight: () => <LanguageMenu />,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.faint,
        // The bar owns the bottom inset; tab screens must not add it again.
        // Keep the icon/label area the same in gesture and three-button modes.
        tabBarStyle: { height: 64 + insets.bottom, paddingTop: 4, paddingBottom: 6 + insets.bottom },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
        tabBarAllowFontScaling: false,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen name="index" options={tabOptions('index', t(tabVisibleLabelKey('index')), t(tabAccessibleLabelKey('index')))} />
      <Tabs.Screen name="auditions" options={tabOptions('auditions', t(tabVisibleLabelKey('auditions')), t(tabAccessibleLabelKey('auditions')))} />
      <Tabs.Screen name="vote" options={tabOptions('vote', t(tabVisibleLabelKey('vote')), t(tabAccessibleLabelKey('vote')))} />
      <Tabs.Screen name="applications" options={tabOptions('applications', t(tabVisibleLabelKey('applications')), t(tabAccessibleLabelKey('applications')))} />
      <Tabs.Screen name="profile" options={tabOptions('profile', t(tabVisibleLabelKey('profile')), t(tabAccessibleLabelKey('profile')))} />
    </Tabs>
  )
}
