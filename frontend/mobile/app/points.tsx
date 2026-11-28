import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Share, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { pointActivityLabels, pointEntryLabels } from '../../web/src/shared/audition/points'
import { useAuth } from '../src/auth/AuthProvider'
import { RequireAuth } from '../src/auth/RequireAuth'
import { pointsApi } from '../src/api/points'
import { normalizeLocale } from '../src/i18n/runtime'
import { WEB_URL } from '../src/config/env'
import { Screen } from '../src/ui/Screen'
import { Button } from '../src/ui/Button'
import { colors, radius } from '../src/theme/tokens'

export default function MemberPointsScreen() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, session } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [page, setPage] = useState(0)
  const key = ['points', 'dashboard', session?.userId] as const
  const dashboard = useQuery({ queryKey: key, queryFn: pointsApi.dashboard, enabled: isAuthenticated })
  const entries = useQuery({ queryKey: ['points', 'entries', session?.userId, page], queryFn: () => pointsApi.entries(page), enabled: isAuthenticated })
  const action = useMutation({
    mutationFn: (kind: 'checkIn' | 'confirmReferral') => pointsApi[kind](),
    onSuccess: data => {
      queryClient.setQueryData(key,data)
      void queryClient.invalidateQueries({queryKey:['points','entries']})
      void queryClient.invalidateQueries({queryKey:['points','quote']})
    },
  })
  const invite = useMutation({
    mutationFn: async () => {
      const code = await pointsApi.invite()
      const locale = normalizeLocale(i18n.language)
      const url = new URL('/' + locale + '/register?invite=' + code, WEB_URL).toString()
      await Share.share({message:url,title:t('points.invitation')})
    },
  })
  const d = dashboard.data
  const number = new Intl.NumberFormat(i18n.language)
  const checked = !!d?.attendance.includes(d.today)
  const hasCheckIn = d?.activities.some(a => a.activity === 'DAILY_CHECK_IN' || a.activity === 'MONTHLY_CHECK_IN')
  return <RequireAuth message={t('apply.loginRequired')}><Screen loading={dashboard.isLoading}>
    <Text style={styles.title}>{t('points.title')}</Text>
    {dashboard.isError ? <Text style={styles.error}>{t('points.loadingError')}</Text> : null}
    {d ? <>
      <View style={styles.row}>
        <View style={styles.balance}><Text style={styles.meta}>{t('points.credit')}</Text><Text style={styles.amount}>{number.format(d.quote.creditBalance)} C</Text></View>
        <View style={styles.balance}><Text style={styles.meta}>{t('points.balance')}</Text><Text style={styles.amount}>{number.format(d.quote.pointBalance)} P</Text></View>
      </View>
      <Button variant="secondary" label={t('nav.credits')} onPress={()=>router.push('/credits')} />
      <Text style={styles.meta}>{t('points.today')} {number.format(d.totals.earnedToday)} P · {t('points.month')} {number.format(d.totals.earnedMonth)} P</Text>
      {d.quote.pointAllowed ? <Text style={styles.meta}>{t('points.uses')}</Text> : null}
      {hasCheckIn || d.attendance.length > 0 ? <View style={styles.card}>
        <Text style={styles.heading}>{t('points.calendar')} · {d.attendance.length}</Text>
        <Text style={styles.meta}>{t('points.dateRule')}</Text>
        <View style={styles.days}>{d.attendance.map(day => <Text key={day} style={styles.pill}>{day}</Text>)}</View>
        {hasCheckIn ? <Button label={t(checked ? 'points.checked' : 'points.checkIn')} disabled={checked || action.isPending} onPress={()=>action.mutate('checkIn')} /> : null}
      </View> : null}
      <View style={styles.card}>
        <Text style={styles.heading}>{t('points.activities')}</Text>
        {!d.activities.length ? <Text style={styles.meta}>{t('points.unavailable')}</Text> : null}
        {d.activities.map(r => <View key={r.activity} style={styles.rule}>
          <Text style={styles.label}>{t('points.'+pointActivityLabels[r.activity])}</Text>
          <Text style={styles.meta}>{number.format(r.progress)} / {number.format(r.goal)} · +{number.format(r.award)} P</Text>
        </View>)}
        {d.activities.some(r=>r.activity==='REFERRAL') ? <Button variant="secondary" label={t('points.inviteShare')} loading={invite.isPending} onPress={()=>invite.mutate()} /> : null}
        {d.referralEligible ? <>
          <Text style={styles.meta}>{t('points.invitePending')}</Text>
          <Button variant="secondary" label={t('points.inviteCheck')} disabled={action.isPending} onPress={()=>action.mutate('confirmReferral')} />
        </> : null}
        {action.isError || invite.isError ? <Text style={styles.error}>{t('points.actionError')}</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>{t('points.history')}</Text>
        {entries.isError ? <Text style={styles.error}>{t('points.loadingError')}</Text> : null}
        {entries.isSuccess && !entries.data.length ? <Text style={styles.meta}>{t('points.empty')}</Text> : null}
        {entries.data?.map(e => <View key={e.id} style={styles.rule}>
          <Text style={styles.label}>{t('points.'+(e.activity?pointActivityLabels[e.activity]:pointEntryLabels[e.kind]))}</Text>
          <Text style={styles.meta}>{new Date(e.createdAt).toLocaleDateString(i18n.language)} · {e.amount > 0 ? '+' : ''}{number.format(e.amount)} P</Text>
        </View>)}
        <View style={styles.row}>
          <View style={styles.cell}><Button variant="secondary" label={t('points.previous')} disabled={page === 0} onPress={()=>setPage(page-1)} /></View>
          <View style={styles.cell}><Button variant="secondary" label={t('points.next')} disabled={(entries.data?.length ?? 0)<50} onPress={()=>setPage(page+1)} /></View>
        </View>
      </View>
    </> : null}
  </Screen></RequireAuth>
}

const styles = StyleSheet.create({
  title:{fontSize:25,fontWeight:'800',color:colors.text,marginBottom:12},
  heading:{fontSize:17,fontWeight:'700',color:colors.text}, meta:{fontSize:13,color:colors.muted,lineHeight:20},
  amount:{fontSize:21,fontWeight:'800',color:colors.purple}, label:{fontWeight:'600',color:colors.text},
  row:{flexDirection:'row',gap:9,marginBottom:10}, cell:{flex:1,minWidth:0},
  balance:{flex:1,backgroundColor:colors.heroStart,padding:12,borderRadius:radius.card},
  card:{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:radius.card,gap:10,marginTop:10,backgroundColor:colors.surface},
  rule:{paddingVertical:6,borderBottomWidth:1,borderBottomColor:colors.border},
  days:{flexDirection:'row',flexWrap:'wrap',gap:5}, pill:{padding:4,backgroundColor:colors.heroStart,color:colors.purple},
  error:{color:colors.dangerText},
})
