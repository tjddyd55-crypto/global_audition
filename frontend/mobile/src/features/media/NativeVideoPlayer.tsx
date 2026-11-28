import { useMemo, useState } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../../theme/tokens'
import { WEB_URL } from '../../config/env'
import { isAllowedTopFrameUrl, planVideoPlayback, webOrigin, youtubeEmbedHtml } from './videoPlayback'

/**
 * YouTube embed만 WebView로 재생한다.
 * embed URL 을 WebView 에 직접 열면 Referer 가 없어 YouTube 가 '오류 153'을 낸다.
 * 그래서 웹 주소(baseUrl)에서 연 HTML 안의 iframe 으로 열어 Referer·origin 을 웹 주소로 보낸다.
 * 영상은 앱 안에서만 재생한다. YouTube 앱·사이트로 이동하는 버튼·링크는 두지 않고,
 * WebView 최상위가 embed 밖(YouTube 등)으로 이동하려 하면 막는다. 재생 불가 시 안내만 보여 준다.
 */
export function NativeVideoPlayer({ videoUrl, autoplay, portrait }: { videoUrl: string; autoplay?: boolean; portrait?: boolean }) {
  const { t } = useTranslation()
  const focused = useIsFocused()
  const origin = webOrigin(WEB_URL)
  const plan = planVideoPlayback(videoUrl, { autoplay, origin })
  const [failed, setFailed] = useState(false)
  const embedUrl = plan.kind !== 'unsupported' ? plan.embedUrl : ''
  const title = t('video.playAria')
  // source 객체가 렌더마다 바뀌면 WebView 가 다시 로드하므로 문자열 기준으로 고정한다.
  const source = useMemo(
    () => ({ html: embedUrl ? youtubeEmbedHtml(embedUrl, title) : '', baseUrl: `${origin ?? ''}/` }),
    [embedUrl, title, origin],
  )
  const bilibili = plan.kind === 'bilibili' ? plan : null
  if (bilibili && !focused) return null
  const openOriginal = () => {
    if (bilibili) void Linking.openURL(bilibili.originalUrl).catch(() => setFailed(true))
  }
  if (embedUrl && origin && !failed) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.stage, portrait && styles.portrait]} accessibilityLabel={t('video.playAria')}>
          <WebView
            source={source}
            style={styles.web}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => {
              // iframe(embed) 안 로드는 허용하고, 최상위 화면이 YouTube 등 바깥으로 이동하는 것은 막는다.
              if (req.isTopFrame === false) return true
              return isAllowedTopFrameUrl(req.url, origin)
            }}
            onError={() => setFailed(true)}
            onHttpError={(e) => {
              if (e.nativeEvent.statusCode >= 400 &&
                  (e.nativeEvent.url === embedUrl || (plan.kind === 'youtube' && e.nativeEvent.url?.includes('youtube')))) setFailed(true)
            }}
          />
        </View>
        {bilibili ? <Text accessibilityRole="link" style={styles.original} onPress={openOriginal}>{t('video.openBilibili')}</Text> : null}
      </View>
    )
  }
  return (
    <View style={styles.fallback}>
      <Text style={styles.message}>{t('video.cannotEmbed')}</Text>
      {bilibili ? (
        <>
          <Text accessibilityRole="button" style={styles.original} onPress={() => setFailed(false)}>{t('video.retry')}</Text>
          <Text accessibilityRole="link" style={styles.original} onPress={openOriginal}>{t('video.openBilibili')}</Text>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#111111',
    minHeight: 180,
  },
  portrait: { width: '62%', aspectRatio: 9 / 16, alignSelf: 'center' },
  web: { flex: 1, backgroundColor: '#111111' },
  fallback: { gap: 8, marginBottom: 12 },
  message: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  original: { color: colors.purple, paddingVertical: 10 },
})
