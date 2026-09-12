import { Linking, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTranslation } from 'react-i18next'
import { getVideoEmbedSrc } from '../domain/videoEmbed'
import { Button } from './Button'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  videoUrl: string
}

/** YouTube embed WebView. 임베드 불가 URL은 외부 브라우저로 연다. */
export function VideoEmbed({ videoUrl }: Props) {
  const { t } = useTranslation()
  const embedSrc = getVideoEmbedSrc(videoUrl)

  if (!embedSrc) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.meta}>{t('video.cannotEmbed')}</Text>
        <Button label={t('video.openInNewWindow')} variant="secondary" onPress={() => void Linking.openURL(videoUrl)} />
      </View>
    )
  }

  return (
    <View style={styles.frame}>
      <WebView source={{ uri: embedSrc }} style={styles.web} allowsFullscreenVideo mediaPlaybackRequiresUserAction />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: space.sm,
  },
  web: { flex: 1 },
  fallback: { gap: space.sm, marginBottom: space.sm },
  meta: { color: colors.muted, lineHeight: 20 },
})
