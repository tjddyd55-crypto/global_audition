import { Stack } from 'expo-router'
import { colors } from '../../src/theme/tokens'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.purple,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: '로그인' }} />
      <Stack.Screen name="register" options={{ title: '회원가입' }} />
    </Stack>
  )
}
