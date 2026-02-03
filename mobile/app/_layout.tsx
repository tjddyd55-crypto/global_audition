import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: '로그인' }} />
        <Stack.Screen name="auditions" options={{ title: '오디션 목록' }} />
      </Stack>
    </QueryClientProvider>
  );
}
