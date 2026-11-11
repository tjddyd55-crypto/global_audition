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
        headerTitle: '글로벌 오디션',
        headerTitleAlign: 'left',
        headerTitleStyle: { fontWeight: '800', fontSize: 17, color: colors.text },
        headerRight: () => <LanguageMenu compact />,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { height: 62 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8) },
        tabBarItemStyle: { flex: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 0 },
        tabBarLabelStyle: { textAlign: 'center', alignSelf: 'center' },
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
