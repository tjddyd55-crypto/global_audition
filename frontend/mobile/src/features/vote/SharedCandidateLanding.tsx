import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { PublicVoteItem, PublicVotesPage } from '../../api/types'
import { Button } from '../../ui/Button'
import { NativeVideoPlayer } from '../media/NativeVideoPlayer'
import { colors, radius } from '../../theme/tokens'
import { VoteShareActions } from './VoteShareActions'
import { canShowPublicVoteCount, remainingMessage, voteRemaining } from '../../../../web/src/shared/vote/voteRemaining'

type Props = {
  page: PublicVotesPage
  shared: PublicVoteItem
  url: string
  voted: boolean
  isGuest: boolean
  voteBusy: boolean
  windowNotice: string | null
  onVote: () => void
  votedName: string | null
  onViewAll: () => void
}

function formatWhen(iso: string | null | undefined, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  try {
    return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
  } catch {
    return d.toISOString()
  }
}

/** 공유 링크 전용: 해당 후보만. 전체 명단·집계는 보여 주지 않는다. */
export function SharedCandidateLanding({
  page,
  shared,
  url,
  voted,
  isGuest,
  voteBusy,
  windowNotice,
  onVote,
  votedName,
  onViewAll,
}: Props) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'ko').split('-')[0]
  const [now, setNow] = useState(() => new Date())
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

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const voteLabel = voted ? t('voteShare.alreadyVoted') : isGuest && page.votingEnabled ? t('voteShare.loginAndVote') : t('voteShare.voteFor', { name })

  return (
    <View style={styles.page} testID="vote-share-landing">
      <Text style={styles.round}>{t('voteShare.roundLabel', { round: linkRound })}</Text>
      <Text style={styles.audition} numberOfLines={2}>{page.audition.title}</Text>

      <View style={styles.card} testID="vote-shared-candidate">
        {shared.videoUrl ? <NativeVideoPlayer videoUrl={shared.videoUrl} /> : null}
        <Text style={styles.name}>{name}</Text>
        {shared.category ? <Text style={styles.field}>{shared.category}</Text> : null}
        {shared.description ? <Text style={styles.intro}>{shared.description}</Text> : null}

        {showCount ? (
          <Text style={styles.votes} testID="vote-own-count">
            {t('voteShare.ownVotes', { n: shared.voteCount })}
          </Text>
        ) : null}

        <Text style={styles.status} testID="vote-status-line">
          {statusLine}
          {phase === 'OPEN' && page.voteEndAt ? ` · ${t('voteShare.endsAt', { end: formatWhen(page.voteEndAt, lang) })}` : ''}
        </Text>
        {phase === 'SCHEDULED' && page.voteStartAt ? (
          <Text style={styles.meta}>{t('voteShare.startsAt', { start: formatWhen(page.voteStartAt, lang) })}</Text>
        ) : null}
        {windowNotice ? <Text style={styles.notice}>{windowNotice}</Text> : null}

        {voted || votedName ? (
          <View style={styles.banner} testID="vote-voted-banner">
            <Text style={styles.bannerTitle}>{t('voteShare.votedFor', { name: votedName || name })}</Text>
            <Text style={styles.bannerBody}>{t('voteShare.shareAgain')}</Text>
          </View>
        ) : isGuest && page.votingEnabled ? (
          <Text style={styles.hint} testID="vote-login-hint">{t('voteShare.loginToVote')}</Text>
        ) : null}

        <Button label={voteLabel} disabled={!page.votingEnabled || voteBusy || voted} onPress={onVote} />
        {voted ? <Text style={styles.sharePrompt}>{t('voteShare.shareAgain')}</Text> : null}
        <VoteShareActions url={url} text={t('voteShare.candidateText', { name })} title={t('voteShare.shareTitle', { name })} />

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
  page: { gap: 8, paddingBottom: 24 },
  round: { color: colors.purple, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  audition: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  name: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 34 },
  field: { color: colors.text, fontWeight: '600', fontSize: 14 },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  votes: { color: colors.purple, fontWeight: '800', fontSize: 28, marginTop: 4 },
  status: { color: colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.muted, fontSize: 13 },
  notice: { color: colors.text, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, fontSize: 13 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  banner: { backgroundColor: '#F5F3FF', borderRadius: 12, padding: 12, gap: 4 },
  bannerTitle: { color: colors.purple, fontWeight: '700', fontSize: 15 },
  bannerBody: { color: colors.purple, fontSize: 13 },
  sharePrompt: { color: colors.purple, fontWeight: '600', textAlign: 'center' },
  viewAllHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  viewAll: { color: colors.purple, fontWeight: '700', fontSize: 15 },
})
