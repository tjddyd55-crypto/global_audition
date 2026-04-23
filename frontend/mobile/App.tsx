import { SafeAreaProvider } from 'react-native-safe-area-context'

import { OtaUpdatePrompt } from './src/components/OtaUpdatePrompt'
import { WebViewApp } from './src/components/WebViewApp'
import { useOtaWatcher } from './src/services/updates'

/**
 * 루트 컴포넌트.
 *
 * 책임
 * 1. SafeAreaProvider로 인셋 컨텍스트 공급.
 * 2. OTA(EAS Update) 상태 관측을 루트에서 한 번만 시작(로그 용도).
 *    실제 체크/다운로드는 네이티브가 부팅 시 자동 수행한다.
 * 3. 다운로드 완료 시 사용자에게 '지금 업데이트 / 나중에'를 묻는
 *    모달을 최상단에 오버레이한다(OtaUpdatePrompt).
 *
 * OtaUpdatePrompt를 WebViewApp '뒤'에 두는 이유는 Modal이 네이티브 레이어에
 * 오버레이되므로 렌더 순서와 무관하게 항상 WebView 위에 뜨기 때문이다.
 */
export default function App() {
  useOtaWatcher()

  return (
    <SafeAreaProvider>
      <WebViewApp />
      <OtaUpdatePrompt />
    </SafeAreaProvider>
  )
}
