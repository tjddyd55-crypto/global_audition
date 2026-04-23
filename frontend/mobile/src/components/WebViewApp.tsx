import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import type { WebView as WebViewType } from 'react-native-webview'
import { WebView } from 'react-native-webview'
import type {
  ShouldStartLoadRequest,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes'

import { WEB_URL, isInternalUrl } from '../config/env'
import { SHELL_BUILD_TAG } from '../config/shellBuild'
import { OfflineScreen } from './OfflineScreen'

/**
 * 앱 본체.
 *
 * 구조
 * - WebView: 기존 PWA를 그대로 렌더.
 * - 외부 URL 가로채기: onShouldStartLoadWithRequest 훅에서 외부 링크를 판별해
 *   시스템 브라우저/메일/전화앱 등으로 위임한다.
 * - 뒤로가기: Android 하드웨어 백 버튼은 WebView 히스토리를 먼저 소모하고,
 *   루트에 도달하면 기본 동작(앱 종료)을 허용한다.
 * - 에러 복구: 로드 실패 시 OfflineScreen을 렌더하여 재시도 UX 제공.
 * - 앱 컨텍스트 식별: UserAgent에 GlobalAuditionApp 마커를 주입해 웹에서 PWA 설치
 *   프롬프트처럼 앱 환경과 충돌하는 UI를 숨길 수 있게 한다.
 */
export function WebViewApp() {
  const webviewRef = useRef<WebViewType>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const userAgentSuffix = useMemo(
    () => `GlobalAuditionApp/1.0 (${Platform.OS})`,
    [],
  )

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const onBack = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack()
        return true
      }
      return false
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack)
    return () => sub.remove()
  }, [canGoBack])

  const handleNavChange = useCallback((e: WebViewNavigation) => {
    setCanGoBack(e.canGoBack)
  }, [])

  const handleShouldStart = useCallback(
    (req: ShouldStartLoadRequest): boolean => {
      const url = req.url
      if (!url || url === 'about:blank') return true
      if (isInternalUrl(url)) return true
      Linking.openURL(url).catch(() => {
        // 외부 앱이 설치되어 있지 않을 수 있으므로 실패는 무시한다.
      })
      return false
    },
    [],
  )

  const handleRetry = useCallback(() => {
    setLoadError(false)
    webviewRef.current?.reload()
  }, [])

  if (loadError) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <OfflineScreen onRetry={handleRetry} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <WebView
        ref={webviewRef}
        source={{ uri: WEB_URL }}
        originWhitelist={['http://*', 'https://*']}
        applicationNameForUserAgent={userAgentSuffix}
        onNavigationStateChange={handleNavChange}
        onShouldStartLoadWithRequest={handleShouldStart}
        onError={() => setLoadError(true)}
        onHttpError={(e) => {
          const status = e.nativeEvent.statusCode
          if (status >= 500) setLoadError(true)
        }}
        startInLoadingState
        renderLoading={renderLoader}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        style={styles.webview}
      />
    </SafeAreaView>
  )
}

function renderLoader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#0a0a0a" />
      <Text style={styles.buildTag}>build {SHELL_BUILD_TAG}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  buildTag: {
    marginTop: 12,
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
})
