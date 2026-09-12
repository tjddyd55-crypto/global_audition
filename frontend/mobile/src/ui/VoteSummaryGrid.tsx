import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { narrow } from '../theme/narrow'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  applicants: number
  totalVotes: number
  totalViews: number
  myVotes: number
}

export function VoteSummaryGrid({ applicants, totalVotes, totalViews, myVotes }: Props) {
  const { t } = useTranslation()
  const cells = [
    t('vote.applicantCount', { n: applicants }),
    t('vote.totalVotes', { n: totalVotes }),
    `${t('vote.totalViews')} ${totalViews}`,
    `${t('vote.myVotes')} ${myVotes}`,
  ]

  return (
    <View style={styles.grid}>
      {cells.map((label) => (
        <View key={label} style={styles.cell}>
          <Text style={styles.label} numberOfLines={2}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { ...narrow.wrap, marginBottom: space.md },
  cell: {
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.sm,
    justifyContent: 'center',
    minHeight: 56,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center', ...narrow.shrink },
})
