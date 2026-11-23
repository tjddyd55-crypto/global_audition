import { Linking, Share, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/Button'
import { colors } from '../../theme/tokens'
import { facebookShareUrl, shareMessage, smsShareUrl } from '../../../../web/src/shared/vote/voteShare'

type Props = { url: string; text: string; title: string }

/**
 * 공유 버튼 모음. 게시는 사용자가 각 앱에서 직접 한다(자동 게시 없음).
 * 카카오톡은 SDK·앱 키 없이 Android 기본 공유 시트에서 고르게 한다. 공유는 투표 수와 무관하다.
 */
export function VoteShareActions({ url, text, title }: Props) {
  const { t } = useTranslation()
  const osShare = () => void Share.share({ title, message: shareMessage(text, url) }).catch(() => undefined)
  return (
    <View style={styles.box} testID="vote-share-actions">
      <View style={styles.row}>
        <View style={styles.cell}>
          <Button label={t('voteShare.share')} variant="secondary" onPress={osShare} />
        </View>
        <View style={styles.cell}>
          <Button label={t('voteShare.kakao')} variant="secondary" onPress={osShare} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Button
            label={t('voteShare.facebook')}
            variant="secondary"
            onPress={() => void Linking.openURL(facebookShareUrl(url)).catch(() => undefined)}
          />
        </View>
        <View style={styles.cell}>
          <Button
            label={t('voteShare.sms')}
            variant="secondary"
            onPress={() => void Linking.openURL(smsShareUrl(text, url)).catch(() => undefined)}
          />
        </View>
      </View>
      <Text style={styles.hint}>{t('voteShare.noVoteEffect')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  hint: { color: colors.muted, fontSize: 12 },
})
