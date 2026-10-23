import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../src/theme/tokens'

export default function AuthLayout() {
  const { t } = useTranslation()
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.purple,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: t('auth.loginTitle') }} />
      <Stack.Screen name="register" options={{ title: t('auth.registerTitle') }} />
      <Stack.Screen name="recover" options={{ title: t('auth.findAccount') }} />
    </Stack>
  )
}
