import 'react-native-gesture-handler'
import { Stack, useGlobalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../src/auth/AuthProvider'
import { LocaleProvider, persistLocale } from '../src/i18n/LocaleProvider'
import { AudienceCountryProvider } from '../src/domain/AudienceCountryProvider'
import { OtaUpdatePrompt } from '../src/components/OtaUpdatePrompt'
import { useOtaWatcher } from '../src/services/updates'
import { colors } from '../src/theme/tokens'
import { LanguageMenu } from '../src/i18n/LanguageMenu'
import { AndroidPushListener } from '../src/features/notifications/AndroidPushListener'

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
            <AudienceCountryProvider>
              <LocalizedStack />
              <AndroidPushListener />
              <OtaUpdatePrompt />
            </AudienceCountryProvider>
          </LocaleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

function LocalizedStack() {
  const { linkLocale } = useGlobalSearchParams<{ linkLocale?: string }>()
  useEffect(() => {
    if (typeof linkLocale === 'string') void persistLocale(linkLocale)
  }, [linkLocale])
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerTintColor: colors.purple,
          headerTitle: '글로벌 오디션',
          headerTitleAlign: 'left',
          headerTitleStyle: { fontWeight: '800', fontSize: 17, color: colors.text },
          headerShadowVisible: false,
          headerRight: () => <LanguageMenu compact />,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="auditions/[id]/index" />
        <Stack.Screen name="auditions/[id]/apply" />
        <Stack.Screen name="auditions/[id]/vote" />
        <Stack.Screen name="auditions/[id]/ranking" />
        <Stack.Screen name="applications/[id]" />
        <Stack.Screen
          name="agency/applicants"
          options={{ headerRight: () => null }}
        />
        <Stack.Screen
          name="agency/[applicationId]"
          options={{ headerRight: () => null }}
        />
        <Stack.Screen name="points" />
        <Stack.Screen name="credits/index" />
        <Stack.Screen name="credits/checkout" />
        <Stack.Screen name="payments/success" />
        <Stack.Screen name="payments/fail" />
        <Stack.Screen name="payments/cancel" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="studio/channel" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="web" />
      </Stack>
    </>
  )
}
