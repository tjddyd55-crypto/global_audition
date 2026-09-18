import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { tabBarLayoutStyle, useTabBarMetrics } from '../../src/theme/tabBarMetrics'
import { colors, tabBar, touch } from '../../src/theme/tokens'

type TabIconName = keyof typeof Ionicons.glyphMap

function TabIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  const color = focused ? colors.purple : colors.tabInactive
  return (
    <Ionicons
      name={name}
      size={tabBar.iconSize}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}

export default function TabsLayout() {
  const { t } = useTranslation()
  const tabMetrics = useTabBarMetrics()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          ...tabBarLayoutStyle(tabMetrics),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', lineHeight: 14 },
        tabBarAllowFontScaling: false,
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: { minHeight: touch.min },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarAccessibilityLabel: t('nav.home'),
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="auditions"
        options={{
          title: t('nav.auditions'),
          tabBarAccessibilityLabel: t('nav.auditions'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'musical-notes' : 'musical-notes-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="vote"
        options={{
          title: t('nav.vote'),
          tabBarAccessibilityLabel: t('nav.vote'),
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'heart' : 'heart-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: t('nav.channel'),
          tabBarAccessibilityLabel: t('nav.channel'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarAccessibilityLabel: t('nav.profile'),
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  )
}
