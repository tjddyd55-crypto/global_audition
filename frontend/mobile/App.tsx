import { SafeAreaProvider } from 'react-native-safe-area-context'

import { WebViewApp } from './src/components/WebViewApp'
import { useOtaWatcher } from './src/services/updates'

/**
 * 루트 컴포넌트.
 *
 * 책임 두 가지만 가진다.
 * 1. SafeAreaProvider로 인셋 컨텍스트 공급.
 * 2. OTA(EAS Update) 상태 관측을 루트에서 한 번만 시작.
 *    실제 업데이트 체크·다운로드는 네이티브가 부팅 시 자동 수행하고
 *    (app.config.ts의 updates.checkAutomatically=ON_LOAD), 이 훅은 결과만 읽는다.
 *    적용은 '다음 앱 부팅' 때 네이티브가 자동 처리한다.
 *
 * 이후 화면 구성이 복잡해지면 이 지점에 React Query 등 전역 Provider를 추가한다.
 */
export default function App() {
  useOtaWatcher()

  return (
    <SafeAreaProvider>
      <WebViewApp />
    </SafeAreaProvider>
  )
}
