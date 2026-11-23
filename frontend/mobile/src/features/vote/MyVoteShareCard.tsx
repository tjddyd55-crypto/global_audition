import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { voteApi } from '../../api/endpoints'
import { WEB_URL } from '../../config/env'
import { TextField } from '../../ui/TextField'
import { colors, radius } from '../../theme/tokens'
import { voteShareUrl } from '../../../../web/src/shared/vote/voteShare'
import { VoteShareActions } from './VoteShareActions'

function when(iso: string | null, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  try {
    return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
  } catch {
    return d.toISOString()
  }
}

/** 지원자 본인 '내 투표 공유하기'. 공개 투표 확정 후보일 때만 보인다. */
export function MyVoteShareCard({ applicationId }: { applicationId: string }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'ko').split('-')[0]
  const q = useQuery({
    queryKey: ['me', 'applications', applicationId, 'vote-share'],
    queryFn: () => voteApi.myShare(applicationId),
    enabled: Boolean(applicationId),
    retry: false,
  })
  const [text, setText] = useState('')
  useEffect(() => {
    setText(t('voteShare.myShareText'))
  }, [t])
  const s = q.data
  if (!s?.candidate || !s.auditionId || !s.roundNumber) return null
  const status =
    s.voteStatus === 'OPEN' ? t('vote.statusOpen') : s.voteStatus === 'SCHEDULED' ? t('vote.statusScheduled') : t('vote.statusClosed')
  const url = voteShareUrl(WEB_URL, lang, s.auditionId, s.roundNumber, applicationId)
  return (
    <View style={styles.card} testID="my-vote-share">
      <Text style={styles.title}>{t('voteShare.myShare')}</Text>
      <Text style={styles.meta}>{t('voteShare.roundLabel', { round: s.roundNumber })}</Text>
      <Text style={styles.meta}>{t('voteShare.status', { status })}</Text>
      {s.voteStatus === 'SCHEDULED' && s.voteStartAt ? (
        <Text style={styles.meta}>{t('voteShare.startsAt', { start: when(s.voteStartAt, lang) })}</Text>
      ) : null}
      {s.voteEndAt ? <Text style={styles.meta}>{t('voteShare.endsAt', { end: when(s.voteEndAt, lang) })}</Text> : null}
      <TextField label={t('voteShare.editText')} value={text} onChangeText={setText} multiline />
      <Text style={styles.url} selectable>
        {url}
      </Text>
      <VoteShareActions url={url} text={text} title={t('voteShare.myShare')} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.purple, borderRadius: radius.card, padding: 14, gap: 8, backgroundColor: colors.surface },
  title: { fontWeight: '800', fontSize: 16, color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
  url: { color: colors.faint, fontSize: 12 },
})
