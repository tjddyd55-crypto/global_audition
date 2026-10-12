import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { colors } from '../../src/theme/tokens'

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? colors.purple : colors.faint }}>{label}</Text>
}

export default function TabsLayout() {
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
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: ({ focused }) => <TabIcon label="홈" focused={focused} /> }} />
      <Tabs.Screen name="auditions" options={{ title: '오디션', tabBarIcon: ({ focused }) => <TabIcon label="오디션" focused={focused} /> }} />
      <Tabs.Screen name="vote" options={{ title: '투표', tabBarIcon: ({ focused }) => <TabIcon label="투표" focused={focused} /> }} />
      <Tabs.Screen name="applications" options={{ title: '내 지원', tabBarIcon: ({ focused }) => <TabIcon label="지원" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: '프로필', tabBarIcon: ({ focused }) => <TabIcon label="나" focused={focused} /> }} />
    </Tabs>
  )
}
