import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { LanguageMenu } from '../../src/i18n/LanguageMenu'
import { colors } from '../../src/theme/tokens'
import { TabIcon, TabLabel } from '../../src/ui/tabs/TabChrome'
import { NATIVE_TAB_ITEMS, type NativeTabRoute } from '../../src/ui/tabs/nativeTabItems'

/**
 * 아이콘 슬롯과 라벨 슬롯을 분리한다.
 * 아이콘에 탭 이름을 다시 그리면 title 라벨과 겹쳐 이름이 두 번 나온다.
 */
function tabOptions(route: NativeTabRoute, label: string) {
  const { icon } = NATIVE_TAB_ITEMS[route]
  return {
    title: label,
    tabBarIcon: ({ color }: { color: string }) => <TabIcon icon={icon} color={color} />,
    tabBarLabel: ({ color }: { color: string }) => <TabLabel label={label} color={color} />,
  }
}

export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerRight: () => <LanguageMenu />,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { minHeight: 64, paddingTop: 4, paddingBottom: 6 },
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
        tabBarAllowFontScaling: false,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen name="index" options={tabOptions('index', t(NATIVE_TAB_ITEMS.index.labelKey))} />
      <Tabs.Screen name="auditions" options={tabOptions('auditions', t(NATIVE_TAB_ITEMS.auditions.labelKey))} />
      <Tabs.Screen name="vote" options={tabOptions('vote', t(NATIVE_TAB_ITEMS.vote.labelKey))} />
      <Tabs.Screen name="applications" options={tabOptions('applications', t(NATIVE_TAB_ITEMS.applications.labelKey))} />
      <Tabs.Screen name="profile" options={tabOptions('profile', t(NATIVE_TAB_ITEMS.profile.labelKey))} />
    </Tabs>
  )
}
