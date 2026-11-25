import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { PublicVoteItem, PublicVotesPage } from '../../api/types'
import { Button } from '../../ui/Button'
import { VoteInlineVideo } from './VoteInlineVideo'
import { colors, radius } from '../../theme/tokens'
import { VoteShareActions } from './VoteShareActions'
import { canShowPublicVoteCount, remainingMessage, voteRemaining } from '../../../../web/src/shared/vote/voteRemaining'
import { formatVoteDate } from '../../../../web/src/shared/vote/voteDate'
import { voteLabelKey } from '../../../../web/src/shared/vote/voteLabels'

type Props = {
  page: PublicVotesPage
  shared: PublicVoteItem
  url: string
  voted: boolean
  voteBusy: boolean
  windowNotice: string | null
  onVote: () => void
  onViewAll: () => void
}

/** 공유 링크 전용: 해당 후보만. 영상 아래는 이름·득표·투표/공유만 둔다. */
export function SharedCandidateLanding({
  page,
  shared,
  url,
  voted,
  voteBusy,
  windowNotice,
  onVote,
  onViewAll,
}: Props) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'ko').split('-')[0]
  const [now, setNow] = useState(() => new Date())
  const [playing, setPlaying] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const name = shared.userName || t('vote.applicantFallback')
  const linkRound = page.roundNumber ?? 1
  const phase = page.voteStatus
  const showCount = canShowPublicVoteCount(phase)
  const remain = remainingMessage(voteRemaining(page.voteEndAt, now), (key, values) => t(`voteShare.${key}`, values ?? { n: 0 }))
  const statusLine =
    phase === 'OPEN' && remain
      ? t('voteShare.openWithRemaining', { remaining: remain })
      : phase === 'OPEN'
        ? t('vote.statusOpen')
        : phase === 'SCHEDULED'
          ? t('vote.statusScheduled')
          : phase === 'CLOSED'
            ? t('vote.statusClosed')
            : t('vote.notStarted')
  const voteLabel = voted ? t('voteShare.alreadyVoted') : t('vote.voteAction')
  const ownVotes = t(voteLabelKey(shared.voteCount, lang, 'voteShare.ownVotes', 'voteShare.ownVotesOne'), {
    n: shared.voteCount,
  })

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <View style={styles.page} testID="vote-share-landing">
      <View style={styles.info}>
        <Text style={styles.round}>{t('voteShare.roundLabel', { round: linkRound })}</Text>
        <Text style={styles.audition}>{page.audition.title}</Text>
        <Text style={styles.status} testID="vote-status-line">{statusLine}</Text>
        {page.voteEndAt ? <Text style={styles.meta}>{t('voteShare.endsAt', { end: formatVoteDate(page.voteEndAt, lang) })}</Text> : null}
        {phase === 'SCHEDULED' && page.voteStartAt ? (
          <Text style={styles.meta}>{t('voteShare.startsAt', { start: formatVoteDate(page.voteStartAt, lang) })}</Text>
        ) : null}
      </View>
      {windowNotice ? <Text style={styles.notice}>{windowNotice}</Text> : null}

      <View style={styles.card} testID="vote-shared-candidate">
        <VoteInlineVideo
          videoUrl={shared.videoUrl}
          thumbnailUrl={shared.thumbnailUrl}
          playing={playing}
          onPlay={() => setPlaying(true)}
        />
        <View style={styles.metaRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {shared.category ? <Text style={styles.field} numberOfLines={1}>{shared.category}</Text> : null}
          </View>
          {showCount ? (
            <Text style={styles.votes} testID="vote-own-count">
              {ownVotes}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <View style={styles.cell}>
            <Button fillHeight label={voteLabel} disabled={!page.votingEnabled || voteBusy || voted} onPress={onVote} />
          </View>
          <View style={styles.cell}>
            <Button fillHeight label={t('voteShare.share')} variant="secondary" onPress={() => setShareOpen((v) => !v)} />
          </View>
        </View>
        {shareOpen ? (
          <VoteShareActions url={url} text={t('voteShare.candidateText', { name })} title={t('voteShare.shareTitle', { name })} />
        ) : null}

        <Pressable
          accessibilityRole="link"
          onPress={onViewAll}
          style={styles.viewAllHit}
          testID="vote-view-all"
        >
          <Text style={styles.viewAll}>{t('voteShare.viewAll')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  info: { gap: 8, padding: 16, backgroundColor: colors.heroStart, borderRadius: radius.card },
  round: { color: colors.purple, fontWeight: '700', fontSize: 13, lineHeight: 22 },
  audition: { color: colors.text, fontSize: 22, fontWeight: '800' },
  status: { color: colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.muted, fontSize: 13 },
  notice: { color: colors.text, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingBottom: 12,
    gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16 },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  field: { color: colors.muted, fontWeight: '600', fontSize: 13, marginTop: 2 },
  votes: { color: colors.purple, fontWeight: '800', fontSize: 18 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  cell: { flex: 1, minWidth: 0 },
  viewAllHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  viewAll: { color: colors.purple, fontWeight: '700', fontSize: 15 },
})
