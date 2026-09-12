import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { agencyApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import type { AgencyBoardStatus } from '../../src/api/types'
import { agencyBoardStatusLabel, agencyConfirmMessage, nationalityLabel, snsPlatformLabel } from '../../src/domain/statusLabels'
import { Button } from '../../src/ui/Button'
import { ConfirmDialog } from '../../src/ui/ConfirmDialog'
import { ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../src/ui/StatusPill'
import { colors } from '../../src/theme/tokens'

export default function AgencyApplicantDetailScreen() {
  const { t } = useTranslation()
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.agencyDetail(applicationId),
    queryFn: () => agencyApi.getDetail(applicationId),
    enabled: Boolean(applicationId),
  })
  const [pending, setPending] = useState<AgencyBoardStatus | null>(null)
  const mutation = useMutation({
    mutationFn: (status: AgencyBoardStatus) => agencyApi.updateStatus(applicationId, status),
    onSuccess: async () => {
      await query.refetch()
      await queryClient.invalidateQueries({ queryKey: ['agency'] })
      setPending(null)
    },
  })
  const detail = query.data

  return (
    <Screen loading={query.isLoading}>
      {query.isError ? <ErrorState message={t('agency.detailLoadFailed')} onRetry={() => void query.refetch()} /> : null}
      {detail ? (
        <View style={styles.stack}>
          <StatusPill label={agencyBoardStatusLabel(detail.status)} tone={toneForApplicationStatus(detail.status)} />
          <Text style={styles.title}>{detail.name || t('agency.nameUnset')}</Text>
          <Text style={styles.meta}>
            {nationalityLabel(detail.nationality)}{' '}
            {detail.age != null ? `· ${t('application.ageYears', { age: detail.age })}` : ''} · {t('application.roundN', { n: detail.round })}
          </Text>
          {detail.introText ? <Text style={styles.body}>{detail.introText}</Text> : null}
          {detail.videoUrl ? (
            <Button label={t('agency.openVideo')} variant="secondary" onPress={() => void Linking.openURL(detail.videoUrl)} />
          ) : null}
          {detail.snsLinks.map((link) => (
            <Text key={`${link.platform}-${link.url}`} style={styles.meta}>
              {snsPlatformLabel(link.platform)} · {link.url}
            </Text>
          ))}
          <Button label={t('agency.markReviewing')} variant="secondary" onPress={() => setPending('REVIEWING')} />
          <Button label={t('agency.markPass')} onPress={() => setPending('APPROVED')} />
          <Button label={t('agency.markReject')} variant="danger" onPress={() => setPending('REJECTED')} />
        </View>
      ) : null}
      <ConfirmDialog
        visible={pending != null}
        message={pending ? agencyConfirmMessage(pending) : ''}
        danger={pending === 'REJECTED'}
        loading={mutation.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) mutation.mutate(pending)
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { color: colors.muted, fontSize: 14 },
  body: { color: colors.text, lineHeight: 22 },
})
