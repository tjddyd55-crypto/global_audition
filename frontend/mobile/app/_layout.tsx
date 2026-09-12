import 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/auth/AuthProvider'
import { LocaleProvider } from '../src/i18n/LocaleProvider'
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
          <LocaleProvider>
            <LocalizedStack />
            <OtaUpdatePrompt />
          </LocaleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

function LocalizedStack() {
  const { t } = useTranslation()
  return (
    <>
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
        <Stack.Screen name="auditions/[id]/index" options={{ title: t('common.auditions') }} />
        <Stack.Screen name="auditions/[id]/apply" options={{ title: t('apply.title') }} />
        <Stack.Screen name="auditions/[id]/vote" options={{ title: t('vote.title') }} />
        <Stack.Screen name="auditions/[id]/ranking" options={{ title: t('ranking.title') }} />
        <Stack.Screen name="applications/[id]" options={{ title: t('common.applications') }} />
        <Stack.Screen name="agency/applicants" options={{ title: t('myApplications.title') }} />
        <Stack.Screen name="agency/[applicationId]" options={{ title: t('myApplications.viewDetail') }} />
        <Stack.Screen name="notifications" options={{ title: t('common.appName') }} />
        <Stack.Screen name="web" options={{ title: t('common.appName') }} />
      </Stack>
    </>
  )
}
