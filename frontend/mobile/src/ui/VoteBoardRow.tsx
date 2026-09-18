import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { PublicVoteItem } from '../api/types'
import { narrow } from '../theme/narrow'
import { colors, space } from '../theme/tokens'
import { Button } from './Button'
import { PosterImage } from './PosterImage'

type Props = {
  item: PublicVoteItem
  disabled: boolean
  onVote: () => void
  onCancel?: () => void
}

export function VoteBoardRow({ item, disabled, onVote, onCancel }: Props) {
  const { t } = useTranslation()
  const name = item.userName?.trim() || t('vote.nameUnset')

  return (
    <View style={styles.row}>
      {item.thumbnailUrl ? <PosterImage uri={item.thumbnailUrl} compact /> : null}
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.rank}>#{item.rank || '—'}</Text>
          <View style={narrow.shrink}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {item.category ? <Text style={styles.meta} numberOfLines={1}>{item.category}</Text> : null}
          </View>
        </View>
        {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
        <Text style={styles.meta}>
          {t('vote.voteCount', { n: item.voteCount })}
          {item.viewCount > 0 ? ` · ${t('profile.viewsCount', { n: item.viewCount })}` : ''}
        </Text>
        {item.videoUrl ? (
          <Pressable
            onPress={() => void Linking.openURL(item.videoUrl)}
            accessibilityRole="link"
            accessibilityLabel={t('vote.playVideo')}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkText}>{t('vote.playVideo')}</Text>
          </Pressable>
        ) : null}
        {item.isVoted ? (
          <View style={styles.votedRow}>
            <Text style={styles.votedLabel}>{t('vote.voted')}</Text>
            {onCancel ? <Button label={t('vote.cancelVote')} variant="secondary" disabled={disabled} onPress={onCancel} /> : null}
          </View>
        ) : (
          <Button label={t('vote.castFor')} disabled={disabled} onPress={onVote} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: space.sm,
    marginBottom: space.lg,
    paddingBottom: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { gap: space.sm },
  head: { ...narrow.row, alignItems: 'flex-start' },
  rank: { width: 36, fontWeight: '800', color: colors.purple, fontSize: 18 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  desc: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  link: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.purple, fontWeight: '700', fontSize: 14 },
  votedRow: { gap: space.xs },
  votedLabel: { color: colors.purple, fontWeight: '700', fontSize: 14 },
  pressed: { opacity: 0.88 },
})
