import { Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { PublicVoteItem } from '../api/types'
import { narrow } from '../theme/narrow'
import { colors, radius, space } from '../theme/tokens'
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
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.rank}>#{item.rank || '—'}</Text>
        <View style={narrow.shrink}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {item.category ? <Text style={styles.meta} numberOfLines={1}>{item.category}</Text> : null}
        </View>
      </View>
      {item.thumbnailUrl ? (
        <PosterImage uri={item.thumbnailUrl} compact />
      ) : null}
      {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
      <Text style={styles.meta}>
        {t('vote.voteCount', { n: item.voteCount })}
        {item.viewCount > 0 ? ` · ${t('profile.viewsCount', { n: item.viewCount })}` : ''}
      </Text>
      {item.videoUrl ? (
        <Button label={t('vote.playVideo')} variant="secondary" onPress={() => void Linking.openURL(item.videoUrl)} />
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
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.sm,
  },
  head: { ...narrow.row, alignItems: 'flex-start' },
  rank: { width: 36, fontWeight: '800', color: colors.purple, fontSize: 18 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  desc: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  votedRow: { gap: space.xs },
  votedLabel: { color: colors.purple, fontWeight: '700', fontSize: 14 },
})
