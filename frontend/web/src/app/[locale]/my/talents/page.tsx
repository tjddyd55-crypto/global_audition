'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@/i18n.config'
import { agencyCastingApi, type SavedTalent, type TalentCard, type TalentSearchParams } from '@/shared/api/casting'
import { AGE_BANDS, CHANNEL_FIELD_FILTERS, CHANNEL_LANGUAGE_CODES } from '@/shared/channel/discovery'
import { AgencyCastingGate } from '@/components/casting/AgencyGate'
import { koAgeBand, koCountry, koField, koLanguage, koStatus } from '@/components/casting/agencyKo'

const COUNTRIES = ['KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER']
const GENDERS = ['FEMALE', 'MALE', 'NON_BINARY'] as const
const KO_GENDER: Record<string, string> = { FEMALE: '여성', MALE: '남성', NON_BINARY: '논바이너리', UNDISCLOSED: '밝히지 않음' }
const ACTIVE = [
  { v: 0, label: '전체 기간' },
  { v: 7, label: '7일 이내' },
  { v: 30, label: '30일 이내' },
  { v: 90, label: '90일 이내' },
]
const PAGE = 30

export default function AgencyTalentsPage() {
  const [tab, setTab] = useState<'search' | 'saved'>('search')
  return (
    <AgencyCastingGate title="인재 검색">
      <div className="flex gap-2" role="tablist">
        {(
          [
            ['search', '검색'],
            ['saved', '저장한 인재'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? 'bg-neutral-900 text-white' : 'border border-neutral-300'}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'search' ? <SearchTab /> : <SavedTab />}
    </AgencyCastingGate>
  )
}

function SearchTab() {
  const [f, setF] = useState<TalentSearchParams>({ sort: 'RECENT_ACTIVITY', acceptsOffers: false, hasCareer: false })
  const [q, setQ] = useState('')
  const [offset, setOffset] = useState(0)
  const params = useMemo(() => ({ ...f, q: q.trim() || undefined, limit: PAGE, offset }), [f, q, offset])
  const search = useQuery({ queryKey: ['agency', 'talents', params], queryFn: () => agencyCastingApi.search(params) })
  const set = (patch: Partial<TalentSearchParams>) => {
    setOffset(0)
    setF((cur) => ({ ...cur, ...patch }))
  }
  const toggleBand = (b: string) => {
    const cur = f.ageBand ?? []
    set({ ageBand: cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b] })
  }
  const total = search.data?.total ?? 0

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3" aria-label="검색 조건">
        <input
          className="w-full rounded-md border border-neutral-300 p-2 text-sm"
          placeholder="활동명(공개한 경우 이름) 검색"
          value={q}
          onChange={(e) => {
            setOffset(0)
            setQ(e.target.value)
          }}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select label="국적" value={f.nationality ?? ''} onChange={(v) => set({ nationality: v || undefined })} options={COUNTRIES.map((c) => [c, koCountry(c)])} />
          <Select label="거주 국가" value={f.residence ?? ''} onChange={(v) => set({ residence: v || undefined })} options={COUNTRIES.map((c) => [c, koCountry(c)])} />
          <Select label="분야" value={f.field ?? ''} onChange={(v) => set({ field: v || undefined })} options={CHANNEL_FIELD_FILTERS.filter((x) => x !== 'ALL').map((c) => [c, koField(c)])} />
          <Select label="사용 언어" value={f.language ?? ''} onChange={(v) => set({ language: v || undefined })} options={CHANNEL_LANGUAGE_CODES.map((c) => [c, koLanguage(c)])} />
          <Select
            label="성별(공개 동의자만)"
            value={f.gender ?? ''}
            onChange={(v) => set({ gender: v || undefined })}
            options={GENDERS.map((g) => [g, KO_GENDER[g]])}
          />
          <Select
            label="최근 활동"
            value={String(f.activeWithinDays ?? 0)}
            onChange={(v) => set({ activeWithinDays: Number(v) || undefined })}
            options={ACTIVE.map((a) => [String(a.v), a.label])}
            noAll
          />
          <Select
            label="정렬"
            value={f.sort ?? 'RECENT_ACTIVITY'}
            onChange={(v) => set({ sort: v })}
            options={[
              ['RECENT_ACTIVITY', '최근 활동순'],
              ['NEWEST', '최신 가입순'],
              ['FOLLOWERS', '팔로워순'],
            ]}
            noAll
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-500">연령대</span>
          {AGE_BANDS.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={(f.ageBand ?? []).includes(b)}
              className={`rounded-full px-2.5 py-1 ${(f.ageBand ?? []).includes(b) ? 'bg-violet-600 text-white' : 'border border-neutral-300'}`}
              onClick={() => toggleBand(b)}
            >
              {koAgeBand(b)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={Boolean(f.hasCareer)} onChange={(e) => set({ hasCareer: e.target.checked })} />
            경력 있음
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={Boolean(f.acceptsOffers)} onChange={(e) => set({ acceptsOffers: e.target.checked })} />
            제안 수신 허용만
          </label>
        </div>
        <p className="text-xs text-neutral-500">
          지원자가 공개로 고른 항목으로만 검색됩니다(성별·연령대·국적 등은 공개에 동의한 회원만 조건에 걸립니다). 실명·생년월일·연락처는 표시되지 않습니다.
          미성년자는 국가 기준과 보호자 확인 상태에 따라 검색·제안이 허용되며, 미성년자에게는 연락처 공유 요청이 붙지 않고 본문에 URL·이메일·전화번호를 넣을 수 없습니다.
        </p>
      </section>

      {search.isLoading ? <p className="text-sm text-neutral-600">검색 중…</p> : null}
      {search.isError ? <p className="text-sm text-red-600">검색하지 못했습니다.</p> : null}
      <p className="text-sm text-neutral-600" data-testid="talent-total">
        {total}명
      </p>
      {search.data && search.data.items.length === 0 ? <p className="text-sm text-neutral-600">조건에 맞는 인재가 없습니다.</p> : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(search.data?.items ?? []).map((t) => (
          <TalentItem key={t.userId} t={t} />
        ))}
      </ul>
      {total > PAGE ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={offset === 0} className="rounded-md border px-3 py-1 disabled:opacity-40" onClick={() => setOffset(Math.max(0, offset - PAGE))}>
            이전
          </button>
          <span>
            {Math.floor(offset / PAGE) + 1} / {Math.ceil(total / PAGE)}
          </span>
          <button type="button" disabled={offset + PAGE >= total} className="rounded-md border px-3 py-1 disabled:opacity-40" onClick={() => setOffset(offset + PAGE)}>
            다음
          </button>
        </div>
      ) : null}
    </div>
  )
}

function TalentItem({ t }: { t: TalentCard }) {
  const qc = useQueryClient()
  const save = useMutation({
    mutationFn: () => (t.saved ? agencyCastingApi.unsave(t.userId) : agencyCastingApi.save(t.userId, null, null).then(() => undefined)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency'] }),
  })
  const meta = [koCountry(t.nationality), t.residenceCountry ? `거주 ${koCountry(t.residenceCountry)}` : '', koAgeBand(t.ageBand), t.gender ? KO_GENDER[t.gender] ?? '' : ''].filter(Boolean).join(' · ')
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3" data-testid="talent-card">
      <div className="flex min-w-0 items-center gap-3">
        {t.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.profileImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-full bg-neutral-200" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-neutral-900">
            {t.nickname ?? '—'}
            {t.realName ? <span className="ml-1 text-xs font-normal text-neutral-500">({t.realName})</span> : null}
          </p>
          <p className="truncate text-xs text-neutral-600">{meta || '공개 정보 없음'}</p>
        </div>
      </div>
      {t.shortBio ? <p className="line-clamp-2 text-sm text-neutral-700">{t.shortBio}</p> : null}
      <p className="text-xs text-neutral-600">
        {[t.mainField ? koField(t.mainField) : '', t.languages.map(koLanguage).join(', '), `영상 ${t.videoCount}`, `경력 ${t.careerCount}`, `팔로워 ${t.followers}`]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className="text-xs">
        {t.acceptsOffers ? <span className="text-emerald-700">제안 수신 허용</span> : <span className="text-neutral-500">제안 받지 않음</span>}
        {t.lastOfferStatus ? <span className="ml-2 text-neutral-600">최근 제안: {koStatus(t.lastOfferStatus)}</span> : null}
        {t.savedGroup ? <span className="ml-2 text-violet-700">그룹: {t.savedGroup}</span> : null}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 text-sm">
        <Link href={`/channel/${t.userId}`} className="rounded-md border border-neutral-300 px-3 py-1.5 no-underline">
          채널 보기
        </Link>
        <button type="button" className="rounded-md border border-neutral-300 px-3 py-1.5" disabled={save.isPending} onClick={() => save.mutate()}>
          {t.saved ? '저장 해제' : '저장'}
        </button>
        {t.acceptsOffers ? (
          <Link href={`/my/casting/new?talent=${t.userId}`} className="rounded-md bg-violet-600 px-3 py-1.5 font-semibold text-white no-underline">
            제안하기
          </Link>
        ) : null}
      </div>
    </li>
  )
}

function SavedTab() {
  const [group, setGroup] = useState('')
  const groups = useQuery({ queryKey: ['agency', 'saved-groups'], queryFn: agencyCastingApi.groups })
  const saved = useQuery({ queryKey: ['agency', 'saved', group], queryFn: () => agencyCastingApi.saved(group || undefined) })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <button type="button" className={`rounded-full px-3 py-1 ${group === '' ? 'bg-neutral-900 text-white' : 'border'}`} onClick={() => setGroup('')}>
          전체
        </button>
        {(groups.data ?? []).map((g) => (
          <button key={g} type="button" className={`rounded-full px-3 py-1 ${group === g ? 'bg-neutral-900 text-white' : 'border'}`} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-500">메모는 우리 기획사 내부에서만 보이며 지원자에게 공개되거나 번역되지 않습니다.</p>
      {saved.isLoading ? <p className="text-sm text-neutral-600">불러오는 중…</p> : null}
      {saved.data && saved.data.length === 0 ? <p className="text-sm text-neutral-600">저장한 인재가 없습니다.</p> : null}
      <ul className="flex flex-col gap-2">
        {(saved.data ?? []).map((s) => (
          <SavedItem key={s.id} s={s} />
        ))}
      </ul>
    </div>
  )
}

function SavedItem({ s }: { s: SavedTalent }) {
  const qc = useQueryClient()
  const [group, setGroup] = useState(s.group ?? '')
  const [memo, setMemo] = useState(s.memo ?? '')
  const [msg, setMsg] = useState('')
  const update = useMutation({
    mutationFn: () => agencyCastingApi.updateSaved(s.talent.userId, group.trim() || null, memo.trim() || null),
    onSuccess: async () => {
      setMsg('저장했습니다.')
      await qc.invalidateQueries({ queryKey: ['agency'] })
    },
    onError: () => setMsg('저장하지 못했습니다.'),
  })
  const remove = useMutation({
    mutationFn: () => agencyCastingApi.unsave(s.talent.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agency'] }),
  })
  const t = s.talent
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3" data-testid="saved-talent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">
          {t.nickname ?? '—'}
          {!t.available ? <span className="ml-2 text-xs font-normal text-amber-700">현재 비공개(검색 노출 꺼짐)</span> : null}
        </p>
        <p className="text-xs text-neutral-600">{t.lastOfferStatus ? `최근 제안: ${koStatus(t.lastOfferStatus)}` : '보낸 제안 없음'}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
        <input className="rounded-md border border-neutral-300 p-2 text-sm" placeholder="그룹(예: 보컬 후보)" maxLength={40} value={group} onChange={(e) => setGroup(e.target.value)} />
        <textarea className="rounded-md border border-neutral-300 p-2 text-sm" placeholder="내부 메모" rows={2} maxLength={1000} value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-white" disabled={update.isPending} onClick={() => update.mutate()}>
          그룹·메모 저장
        </button>
        {t.available ? (
          <Link href={`/channel/${t.userId}`} className="rounded-md border px-3 py-1.5 no-underline">
            채널 보기
          </Link>
        ) : null}
        <Link href={`/my/casting?talentId=${t.userId}`} className="rounded-md border px-3 py-1.5 no-underline">
          제안 이력
        </Link>
        {t.available && t.acceptsOffers ? (
          <Link href={`/my/casting/new?talent=${t.userId}`} className="rounded-md bg-violet-600 px-3 py-1.5 font-semibold text-white no-underline">
            제안하기
          </Link>
        ) : null}
        <button type="button" className="rounded-md border border-red-200 px-3 py-1.5 text-red-700" disabled={remove.isPending} onClick={() => remove.mutate()}>
          저장 해제
        </button>
        {msg ? <span className="text-xs text-neutral-600">{msg}</span> : null}
      </div>
    </li>
  )
}

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: (readonly [string, string])[] | [string, string][]; noAll?: boolean }) {
  return (
    <label className="flex min-w-0 flex-col text-xs text-neutral-600">
      {props.label}
      <select className="mt-1 w-full min-w-0 rounded-md border border-neutral-300 p-2 text-sm text-neutral-900" value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.noAll ? null : <option value="">전체</option>}
        {props.options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
