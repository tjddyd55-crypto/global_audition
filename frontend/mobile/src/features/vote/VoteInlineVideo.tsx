import { bilibiliLink } from '../../../../web/src/shared/audition/bilibili'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { youtubeThumbnailUrl } from '../../domain/videoUrl'
import { NativeVideoPlayer } from '../media/NativeVideoPlayer'


function isShortsUrl(url: string): boolean {
  return /youtube\.com\/shorts\//i.test(url)
}


type Props = {
  videoUrl?: string | null
  thumbnailUrl?: string | null
  playing: boolean
  onPlay: () => void
  compact?: boolean
}

/**
 * 썸네일만 먼저 보여 주고, 탭하면 페이지 안에서 재생한다.
 * 자동재생은 하지 않는다. 쇼츠는 9:16. 한 번에 하나만 재생하는 것은 부모가 맡는다.
 */
export function VoteInlineVideo({ videoUrl, thumbnailUrl, playing, onPlay, compact }: Props) {
  const { t } = useTranslation()
  const url = videoUrl ?? ''
  const shorts = isShortsUrl(url)
  const thumb = thumbnailUrl || youtubeThumbnailUrl(url)
  if (playing && url) {
    return <NativeVideoPlayer videoUrl={url} autoplay portrait={shorts} />
  }
  const stage = shorts ? (compact ? styles.shortsCompact : styles.shorts) : styles.wide
  return (
    <Pressable
      onPress={url ? onPlay : undefined}
      style={[styles.stage, stage]}
      accessibilityRole="button"
      accessibilityLabel={t('vote.playVideo')}
      testID="vote-inline-play"
    >
      {thumb ? <Image source={{ uri: thumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : (
        <View style={styles.blank}>{bilibiliLink(url)?.kind === 'video' ? <Text style={{ color: '#fff', padding: 8 }}>Bilibili</Text> : null}</View>
      )}
      {url ? (
        <View style={styles.play} pointerEvents="none">
          <Text style={styles.playIcon}>▶</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  stage: { width: '100%', backgroundColor: '#111', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  wide: { aspectRatio: 16 / 9 },
  shorts: { aspectRatio: 9 / 16, maxHeight: 520, alignSelf: 'center', width: '80%' },
  shortsCompact: { aspectRatio: 9 / 16, maxHeight: 320, alignSelf: 'center', width: '70%' },
  blank: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1f2937' },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 22, marginLeft: 3 },
})
