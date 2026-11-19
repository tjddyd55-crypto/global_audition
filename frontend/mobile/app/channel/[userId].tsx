import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { publicPlatformApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import type { ChannelCareerRow, MyChannelVideoItem } from '../../src/api/types'
import { useAuth } from '../../src/auth/AuthProvider'
import { WEB_URL } from '../../src/config/env'
import { NativeVideoPlayer } from '../../src/features/media/NativeVideoPlayer'
import { formatCount } from '../../src/i18n/format'
import { Button } from '../../src/ui/Button'
import { ChannelMetaLine } from '../../src/ui/ChannelMetaLine'
import { EmptyState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, radius } from '../../src/theme/tokens'
import { CAREER_CATEGORIES, formatCareerPeriod } from '../../../web/src/shared/channel/discovery'
import { toRecruitFieldCode } from '../../../web/src/shared/audition/recruitFields'

type Tab = 'videos' | 'profile' | 'career'

function thumbOf(v: MyChannelVideoItem): string | null {
  if (v.thumbnailUrl && /^https?:\/\//.test(v.thumbnailUrl)) return v.thumbnailUrl
  return v.youtubeVideoId ? `https://i.ytimg.com/vi/${v.youtubeVideoId}/hqdefault.jpg` : null
}

function isShorts(v: MyChannelVideoItem): boolean {
  return v.shorts === true || /\/shorts\//i.test(v.videoUrl ?? '')
}

export default function ChannelScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session, isAuthenticated } = useAuth()
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const id = String(userId ?? '')
  const [tab, setTab] = useState<Tab>('videos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [views, setViews] = useState<Record<string, number>>({})

  const query = useQuery({
    queryKey: ['public-channel', id, isAuthenticated],
    queryFn: () => publicPlatformApi.channel(id),
    enabled: Boolean(id),
    retry: false,
  })
  const videosQuery = useQuery({
    queryKey: ['public-channel-videos', id],
    queryFn: () => publicPlatformApi.channelVideos(id),
    enabled: Boolean(id),
  })
  const follow = useMutation({
    mutationFn: () => (query.data?.subscribed ? publicPlatformApi.unfollow(id) : publicPlatformApi.follow(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['public-channel', id] }),
  })

  const data = query.data
  const featuredId = data?.featuredVideo?.videoId ?? data?.featuredVideoId ?? null
  const videos = useMemo(() => {
    const list = videosQuery.data ?? []
    const f = featuredId ? list.find((v) => v.videoId === featuredId) : undefined
    return f ? [f, ...list.filter((v) => v.videoId !== featuredId)] : list
  }, [videosQuery.data, featuredId])
  const selected = videos.find((v) => v.videoId === selectedId) ?? videos[0] ?? null

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404
    return (
      <Screen>
        <EmptyState title={notFound ? t('channel.privateNotice') : t('channel.loadFailed')} />
      </Screen>
    )
  }

  const own = Boolean(session?.userId && session.userId === id)
  const name = data?.nickname?.trim() || data?.displayName || ''
  const play = (v: MyChannelVideoItem) => {
    setSelectedId(v.videoId)
    setPlaying(true)
    if (v.embedStatus !== 'NOT_FOUND' && v.embedStatus !== 'RESTRICTED') {
      publicPlatformApi
        .bumpView(v.videoId)
        .then((r) => {
          const n = Number((r as { viewCount?: unknown } | null)?.viewCount)
          if (Number.isFinite(n)) setViews((cur) => ({ ...cur, [v.videoId]: n }))
        })
        .catch(() => undefined)
    }
  }
  const viewsOf = (v: MyChannelVideoItem) => views[v.videoId] ?? Number(v.viewCount ?? 0)

  return (
    <Screen loading={query.isLoading} padded={false} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={styles.banner}>
        {data?.bannerImageUrl && /^https?:\/\//.test(data.bannerImageUrl) ? (
          <Image source={{ uri: data.bannerImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
      </View>
      <View style={styles.header}>
        {data?.profileImageUrl && /^https?:\/\//.test(data.profileImageUrl) ? (
          <Image source={{ uri: data.profileImageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPh]}>
            <Text style={styles.avatarInitial}>{Array.from(name)[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{name}</Text>
        <ChannelMetaLine nationality={data?.nationality ?? data?.country} residence={data?.residenceCountry} mainField={data?.mainField} />
        {data?.shortBio?.trim() ? <Text style={styles.shortBio}>{data.shortBio.trim()}</Text> : null}
        <Text style={styles.stats}>
          {t('channel.statVideos')} {formatCount(data?.videoCount ?? 0, i18n.language)} · {t('channel.statFollowers')}{' '}
          {formatCount(data?.subscriberCount ?? 0, i18n.language)} · {t('channel.statViews')} {formatCount(data?.viewCount ?? 0, i18n.language)}
        </Text>
        <View style={styles.actions}>
          {own ? (
            <View style={styles.flex}>
              <Button label={t('channel.manage')} onPress={() => router.push('/studio/channel')} />
            </View>
          ) : (
            <View style={styles.flex}>
              <Button
                label={!isAuthenticated ? t('channel.loginToFollow') : data?.subscribed ? t('channel.following') : t('channel.follow')}
                variant={data?.subscribed ? 'secondary' : 'primary'}
                loading={follow.isPending}
                onPress={() => (isAuthenticated ? follow.mutate() : router.push('/login'))}
              />
            </View>
          )}
          {!own && data?.canSendCastingOffer ? (
            <View style={styles.flex}>
              <Button
                label={t('channel.sendCastingOffer')}
                onPress={() => router.push({ pathname: '/web', params: { path: `/ko/my/casting/new?talent=${id}` } })}
              />
            </View>
          ) : null}
          <View style={styles.flex}>
            <Button
              label={t('channel.share')}
              variant="secondary"
              onPress={() => void Share.share({ message: `${name} ${WEB_URL.replace(/\/$/, '')}/${i18n.language}/channel/${id}` })}
            />
          </View>
        </View>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {(['videos', 'profile', 'career'] as const).map((k) => (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === k }}
            onPress={() => setTab(k)}
            style={[styles.tab, tab === k && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === k && styles.tabTextOn]} numberOfLines={1}>
              {k === 'videos' ? t('channel.tabVideos') : k === 'profile' ? t('channel.tabProfile') : t('channel.tabCareer')}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        {tab === 'videos' ? (
          selected ? (
            <View>
              {selected.embedStatus === 'NOT_FOUND' || selected.embedStatus === 'RESTRICTED' ? (
                <View style={styles.blocked}>
                  <Text style={styles.blockedText}>
                    {selected.embedStatus === 'NOT_FOUND' ? t('channel.embedNotFound') : t('channel.embedRestricted')}
                  </Text>
                </View>
              ) : playing ? (
                <NativeVideoPlayer key={selected.videoId} videoUrl={selected.videoUrl} autoplay portrait={isShorts(selected)} />
              ) : (
                <Pressable style={styles.poster} onPress={() => play(selected)} accessibilityRole="button" accessibilityLabel={selected.title}>
                  {thumbOf(selected) ? <Image source={{ uri: thumbOf(selected) ?? '' }} style={StyleSheet.absoluteFill} /> : null}
                  <View style={styles.playBtn}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                </Pressable>
              )}
              <Text style={styles.videoTitle}>{selected.title}</Text>
              <Text style={styles.muted}>{t('channel.videoViews', { count: formatCount(viewsOf(selected), i18n.language) })}</Text>
              <Text style={styles.hint}>{t('channel.viewsInternalHint')}</Text>
              {videos.length > 1 ? <Text style={styles.section}>{t('channel.allVideos')}</Text> : null}
              <View style={styles.grid}>
                {videos.length > 1
                  ? videos.map((v) => (
                      <Pressable key={v.videoId} style={styles.cell} onPress={() => play(v)} accessibilityRole="button" accessibilityLabel={v.title}>
                        <View style={[styles.cellThumb, v.videoId === selected.videoId && styles.cellOn]}>
                          {thumbOf(v) ? <Image source={{ uri: thumbOf(v) ?? '' }} style={StyleSheet.absoluteFill} /> : null}
                          {isShorts(v) ? <Text style={styles.shorts}>{t('channel.shortsBadge')}</Text> : null}
                        </View>
                        <Text style={styles.cellTitle} numberOfLines={2}>
                          {v.title}
                        </Text>
                        <Text style={styles.cellMeta}>{t('channel.videoViews', { count: formatCount(viewsOf(v), i18n.language) })}</Text>
                      </Pressable>
                    ))
                  : null}
              </View>
            </View>
          ) : videosQuery.isLoading ? null : (
            <EmptyState title={t('channel.emptyVideos')} />
          )
        ) : tab === 'profile' ? (
          <ProfileTab data={data} />
        ) : (
          <CareerTab careers={data?.careers ?? []} legacy={data?.careerText ?? ''} />
        )}
      </View>
    </Screen>
  )
}

function ProfileTab({ data }: { data: Awaited<ReturnType<typeof publicPlatformApi.channel>> | undefined }) {
  const { t } = useTranslation()
  if (!data) return null
  const facts: Array<[string, string]> = []
  const nat = (data.nationality ?? data.country ?? '').toUpperCase()
  if (nat) facts.push([t('channel.profileNationality'), t(`nationality.${nat}`)])
  if (data.residenceCountry) facts.push([t('channel.profileResidence'), t(`nationality.${data.residenceCountry}`)])
  if (data.ageBand) facts.push([t('channel.profileAge'), t(`channel.ageBand.${data.ageBand}`)])
  if ((data.languages ?? []).length) facts.push([t('channel.profileLanguages'), (data.languages ?? []).map((l) => t(`languages.${l}`)).join(', ')])
  if ((data.categories ?? []).length)
    facts.push([
      t('channel.profileSpecialties'),
      (data.categories ?? []).map((c) => {
        const code = toRecruitFieldCode(c)
        return code ? t(`recruitField.${code}`) : c
      }).join(', '),
    ])
  const texts: Array<[string, string]> = []
  if (data.bio?.trim()) texts.push([t('channel.profileIntro'), data.bio.trim()])
  if (data.introText?.trim()) texts.push([t('channel.extraIntroTab'), data.introText.trim()])
  if (data.channelDescription?.trim()) texts.push([t('channel.description'), data.channelDescription.trim()])
  if (data.talents?.trim()) texts.push([t('channel.profileTalents'), data.talents.trim()])
  const sns = data.snsLinks ?? []
  if (!facts.length && !texts.length && !sns.length) return <EmptyState title={t('channel.profileEmpty')} />
  return (
    <View style={styles.gap}>
      {facts.map(([k, v]) => (
        <View key={k}>
          <Text style={styles.label}>{k}</Text>
          <Text style={styles.value}>{v}</Text>
        </View>
      ))}
      {texts.map(([k, v]) => (
        <View key={k}>
          <Text style={styles.label}>{k}</Text>
          <Text style={styles.value}>{v}</Text>
        </View>
      ))}
      {sns.length ? (
        <View>
          <Text style={styles.label}>{t('channel.profileSns')}</Text>
          {sns.map((s, i) => (
            <Pressable key={`${s.platform}-${i}`} onPress={() => void Linking.openURL(s.url)} accessibilityRole="link">
              <Text style={styles.link}>{s.platform}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function CareerTab({ careers, legacy }: { careers: ChannelCareerRow[]; legacy: string }) {
  const { t } = useTranslation()
  const groups = CAREER_CATEGORIES.map((cat) => ({ cat, rows: careers.filter((c) => c.category === cat) })).filter((g) => g.rows.length)
  if (!groups.length && !legacy.trim()) return <EmptyState title={t('channel.careerEmpty')} />
  return (
    <View style={styles.gap}>
      {groups.map((g) => (
        <View key={g.cat}>
          <Text style={styles.label}>{t(`channel.careerCategory.${g.cat}`)}</Text>
          {g.rows.map((c) => (
            <View key={c.id} style={styles.careerItem}>
              <Text style={styles.value}>{c.title}</Text>
              <Text style={styles.muted}>
                {[c.organization, formatCareerPeriod(c.periodStart, c.periodEnd, t('channel.present'))].filter(Boolean).join(' · ')}
              </Text>
              {c.description ? <Text style={styles.desc}>{c.description}</Text> : null}
            </View>
          ))}
        </View>
      ))}
      {legacy.trim() ? (
        <View>
          <Text style={styles.label}>{t('channel.careerLegacy')}</Text>
          <Text style={styles.value}>{legacy.trim()}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { height: 112, backgroundColor: '#ece6ff', overflow: 'hidden' },
  header: { paddingHorizontal: 16, gap: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', marginTop: -40, backgroundColor: '#eee' },
  avatarPh: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.heroStart },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: colors.purple },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  shortBio: { fontSize: 14, color: colors.text },
  stats: { fontSize: 13, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', marginTop: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: colors.border },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#f6f6f8',
    marginHorizontal: 2,
  },
  tabOn: { backgroundColor: '#fff', borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextOn: { color: colors.text },
  body: { padding: 16 },
  poster: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', borderRadius: radius.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 26 },
  blocked: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', padding: 16, marginBottom: 12 },
  blockedText: { color: '#fff', textAlign: 'center' },
  videoTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { fontSize: 12, color: colors.muted },
  hint: { fontSize: 11, color: colors.muted, marginBottom: 8 },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { width: '48.5%', marginBottom: 12 },
  cellThumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', backgroundColor: '#eee' },
  cellOn: { borderWidth: 2, borderColor: colors.purple },
  shorts: { position: 'absolute', top: 4, left: 4, backgroundColor: '#dc2626', color: '#fff', fontSize: 10, fontWeight: '800', paddingHorizontal: 4, borderRadius: 3 },
  cellTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  cellMeta: { fontSize: 11, color: colors.muted },
  gap: { gap: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  value: { fontSize: 14, color: colors.text, lineHeight: 20 },
  desc: { fontSize: 13, color: colors.text, marginTop: 2 },
  link: { fontSize: 14, color: colors.purple, fontWeight: '600', paddingVertical: 4 },
  careerItem: { borderLeftWidth: 2, borderColor: '#e4dcff', paddingLeft: 10, marginTop: 6 },
})
