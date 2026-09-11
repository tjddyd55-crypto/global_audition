import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import { colors } from '../../src/theme/tokens'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? colors.purple : colors.faint }}>{label}</Text>
}

export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { minHeight: 56 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.home'), tabBarIcon: ({ focused }) => <TabIcon label={t('nav.home')} focused={focused} /> }} />
      <Tabs.Screen name="auditions" options={{ title: t('nav.auditions'), tabBarIcon: ({ focused }) => <TabIcon label={t('nav.auditions')} focused={focused} /> }} />
      <Tabs.Screen name="vote" options={{ title: t('nav.vote'), tabBarIcon: ({ focused }) => <TabIcon label={t('nav.vote')} focused={focused} /> }} />
      <Tabs.Screen name="applications" options={{ title: t('nav.applications'), tabBarIcon: ({ focused }) => <TabIcon label={t('nav.applications')} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile'), tabBarIcon: ({ focused }) => <TabIcon label={t('nav.profile')} focused={focused} /> }} />
    </Tabs>
  )
}
