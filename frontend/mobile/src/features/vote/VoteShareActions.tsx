import { useState } from 'react'
import { Clipboard, Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '../../ui/Button'
import { colors } from '../../theme/tokens'
import {
  facebookShareUrl,
  INSTAGRAM_APP_URLS,
  INSTAGRAM_WEB_URL,
  shareMessage,
} from '../../../../web/src/shared/vote/voteShare'

type Props = { url: string; text: string; title: string }

function copyPayload(value: string): boolean {
  try {
    // RN에 아직 남아 있는 클립보드를 쓴다. 새 네이티브 모듈은 추가하지 않는다.
    Clipboard.setString(value)
    return true
  } catch {
    return false
  }
}

async function openInstagram(): Promise<void> {
  for (const href of [...INSTAGRAM_APP_URLS, INSTAGRAM_WEB_URL]) {
    try {
      await Linking.openURL(href)
      return
    } catch {
      /* 다음 주소를 시도 */
    }
  }
}

/**
 * 공유 버튼 모음. Facebook, Instagram, 링크 복사만.
 * Instagram 공식 링크 공유 주소가 없어 문구+링크를 복사하고 붙여 넣도록 안내한 뒤 앱(또는 웹)을 연다.
 * 게시는 사용자가 각 앱에서 직접 한다. 공유는 투표 수와 무관하다.
 */
export function VoteShareActions({ url, text }: Props) {
  const { t } = useTranslation()
  const [hint, setHint] = useState<string | null>(null)
  const payload = () => shareMessage(text, url)

  const onCopy = () => {
    if (copyPayload(payload())) setHint(t('voteShare.copied'))
    else setHint(t('voteShare.copyFailed'))
  }

  const onInstagram = () => {
    if (copyPayload(payload())) setHint(t('voteShare.instagramHint'))
    else setHint(t('voteShare.copyFailed'))
    void openInstagram()
  }

  return (
    <View style={styles.box} testID="vote-share-actions">
      <View style={styles.row}>
        <View style={styles.cell}>
          <Button
            label={t('voteShare.facebook')}
            variant="secondary"
            onPress={() => void Linking.openURL(facebookShareUrl(url)).catch(() => undefined)}
          />
        </View>
        <View style={styles.cell}>
          <Button label={t('voteShare.instagram')} variant="secondary" onPress={onInstagram} />
        </View>
      </View>
      <Button label={t('voteShare.copy')} variant="secondary" onPress={onCopy} />
      {hint ? (
        <Text style={styles.hint} testID="vote-share-hint">
          {hint}
        </Text>
      ) : (
        <Text style={styles.hint}>{t('voteShare.noVoteEffect')}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  hint: { color: colors.muted, fontSize: 12 },
})
