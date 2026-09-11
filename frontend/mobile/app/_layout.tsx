import 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/auth/AuthProvider'
import { OtaUpdatePrompt } from '../src/components/OtaUpdatePrompt'
import { useOtaWatcher } from '../src/services/updates'
import { colors } from '../src/theme/tokens'

export default function RootLayout() {
  useOtaWatcher()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  )

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            initialRouteName="(tabs)"
            screenOptions={{
              headerTintColor: colors.purple,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="auditions/[id]/index" options={{ title: '오디션' }} />
            <Stack.Screen name="auditions/[id]/apply" options={{ title: '지원하기' }} />
            <Stack.Screen name="auditions/[id]/vote" options={{ title: '투표' }} />
            <Stack.Screen name="auditions/[id]/ranking" options={{ title: '랭킹' }} />
            <Stack.Screen name="applications/[id]" options={{ title: '지원서' }} />
            <Stack.Screen name="agency/applicants" options={{ title: '지원자 관리' }} />
            <Stack.Screen name="agency/[applicationId]" options={{ title: '지원자 상세' }} />
            <Stack.Screen name="notifications" options={{ title: '알림' }} />
            <Stack.Screen name="web" options={{ title: '웹으로 열기' }} />
          </Stack>
          <OtaUpdatePrompt />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
