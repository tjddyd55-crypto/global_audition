import { SafeAreaProvider } from 'react-native-safe-area-context'

import { WebViewApp } from './src/components/WebViewApp'

/**
 * 루트 컴포넌트.
 *
 * SafeAreaProvider가 최상단에 자리해야 edge 인셋을 안전하게 읽을 수 있다.
 * 이후 화면 구성이 복잡해지면 이 지점에 React Query 등 전역 Provider를 추가한다.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <WebViewApp />
    </SafeAreaProvider>
  )
}
