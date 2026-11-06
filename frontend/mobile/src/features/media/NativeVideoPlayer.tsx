import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/Button'
import { colors, radius } from '../../theme/tokens'
import { planVideoPlayback } from './videoPlayback'

/**
 * YouTube embed만 WebView로 재생한다.
 * 로드에 실패하거나 지원하지 않는 주소는 오류와 외부 열기만 보여 준다.
 */
export function NativeVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const { t } = useTranslation()
  const plan = planVideoPlayback(videoUrl)
  const [failed, setFailed] = useState(false)
  if (plan.kind === 'youtube' && !failed) {
    return (
      <View style={styles.stage} accessibilityLabel={t('video.playAria')}>
        <WebView
          source={{ uri: plan.embedUrl }}
          style={styles.web}
          originWhitelist={['https://*']}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          onError={() => setFailed(true)}
        />
      </View>
    )
  }
  return (
    <View style={styles.fallback}>
      <Text style={styles.message}>{t('video.cannotEmbed')}</Text>
      <Button label={t('video.openInNewWindow')} variant="secondary" onPress={() => void Linking.openURL(videoUrl)} />
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#111111',
    minHeight: 180,
    marginBottom: 12,
  },
  web: { flex: 1, backgroundColor: '#111111' },
  fallback: { gap: 8, marginBottom: 12 },
  message: { color: colors.muted, fontSize: 14, lineHeight: 20 },
})
