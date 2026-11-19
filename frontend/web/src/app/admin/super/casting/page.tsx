'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminCastingApi, type AgencyControl, type CastingReport } from '@/shared/api/casting'
import { koCountry, koField, koReportReason, koStatus } from '@/components/casting/agencyKo'

type Tab = 'stats' | 'reports' | 'agencies' | 'moderation'
const TABS: [Tab, string][] = [
  ['stats', '통계'],
  ['reports', '신고 처리'],
  ['agencies', '기획사 제안 권한'],
  ['moderation', '채널·영상 숨김'],
]

export default function SuperAdminCastingPage() {
  const [tab, setTab] = useState<Tab>('stats')
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">채널·캐스팅 운영</h1>
        <p className="mt-1 text-sm text-gray-600">
          관리자는 계약을 만들지 않습니다. 모든 변경은{' '}
          <Link href="/admin/super/logs" className="underline">
            감사 로그
          </Link>
          에 남습니다. 유료 플랜·과금은 아직 없습니다(구조만 준비).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={`rounded-md px-3 py-1.5 text-sm ${tab === k ? 'bg-[#3B82F6] text-white' : 'border bg-white'}`} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'stats' ? <Stats /> : null}
      {tab === 'reports' ? <Reports /> : null}
      {tab === 'agencies' ? <Agencies /> : null}
      {tab === 'moderation' ? <Moderation /> : null}
    </div>
  )
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}

function Stats() {
  const q = useQuery({ queryKey: ['admin', 'casting', 'stats'], queryFn: adminCastingApi.stats })
  if (q.isLoading) return <p className="text-sm">불러오는 중…</p>
  if (q.isError || !q.data) return <p className="text-sm text-red-600">통계를 불러오지 못했습니다.</p>
  const s = q.data
  const maxDaily = Math.max(1, ...s.dailyOffers.map((d) => d.sent))
  return (
    <div className="flex flex-col gap-4" data-testid="casting-stats">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="공개 채널" value={s.publicChannels} />
        <Card label="공개 영상(YouTube 링크)" value={s.publicVideos} />
        <Card label="인재 검색 노출" value={s.talentSearchVisible} />
        <Card label="제안 수신 허용" value={s.castingOptIn} />
        <Card label="전체 제안" value={s.totalOffers} />
        <Card label="수락률(응답 중)" value={`${s.acceptanceRate}%`} />
        <Card label="열린 신고" value={s.reportsByStatus.find((r) => r.key === 'OPEN')?.count ?? 0} />
        <Card label="제안 상태" value={s.offersByStatus.map((r) => `${koStatus(r.key)} ${r.count}`).join(' · ') || '—'} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-3">
          <h2 className="text-sm font-semibold">국가별 공개 채널</h2>
          <ul className="mt-2 text-sm">
            {s.channelsByCountry.map((r) => (
              <li key={r.key} className="flex justify-between border-b py-1">
                <span>{r.key === 'UNSPECIFIED' ? '미입력' : koCountry(r.key)}</span>
                <span>{r.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border bg-white p-3">
          <h2 className="text-sm font-semibold">분야별 인재</h2>
          <ul className="mt-2 text-sm">
            {s.talentsByField.map((r) => (
              <li key={r.key} className="flex justify-between border-b py-1">
                <span>{koField(r.key)}</span>
                <span>{r.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="rounded-lg border bg-white p-3">
        <h2 className="text-sm font-semibold">일별 제안(최근 14일, UTC)</h2>
        <ul className="mt-2 flex flex-col gap-1 text-xs">
          {s.dailyOffers.map((d) => (
            <li key={d.day} className="flex items-center gap-2">
              <span className="w-20 shrink-0">{d.day.slice(5)}</span>
              <span className="h-3 rounded bg-blue-400" style={{ width: `${(d.sent / maxDaily) * 60}%`, minWidth: d.sent ? 4 : 0 }} />
              <span>
                보냄 {d.sent} · 수락 {d.accepted}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="overflow-x-auto rounded-lg border bg-white p-3">
        <h2 className="text-sm font-semibold">기획사별 제안</h2>
        <table className="mt-2 w-full min-w-[40rem] text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th>기획사</th>
              <th>보냄</th>
              <th>수락</th>
              <th>거절</th>
              <th>대기</th>
              <th>수락률</th>
              <th>열린 신고</th>
              <th>제한</th>
            </tr>
          </thead>
          <tbody>
            {s.offersByAgency.map((a) => (
              <tr key={a.agencyUserId} className="border-t">
                <td className="py-1">{a.name ?? a.agencyUserId}</td>
                <td>{a.sent}</td>
                <td>{a.accepted}</td>
                <td>{a.declined}</td>
                <td>{a.open}</td>
                <td>{a.acceptanceRate}%</td>
                <td>{a.openReports}</td>
                <td>{a.restricted ? '제한' : a.dailyLimit != null ? `일 ${a.dailyLimit}` : '기본'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Reports() {
  const [status, setStatus] = useState('OPEN')
  const q = useQuery({ queryKey: ['admin', 'casting', 'reports', status], queryFn: () => adminCastingApi.reports(status || undefined) })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        {[
          ['OPEN', '처리 대기'],
          ['RESOLVED', '조치 완료'],
          ['DISMISSED', '기각'],
          ['', '전체'],
        ].map(([v, l]) => (
          <button key={v || 'ALL'} type="button" className={`rounded-md px-3 py-1 ${status === v ? 'bg-gray-900 text-white' : 'border bg-white'}`} onClick={() => setStatus(v)}>
            {l}
          </button>
        ))}
      </div>
      {q.data && q.data.length === 0 ? <p className="text-sm text-gray-600">신고가 없습니다.</p> : null}
      <ul className="flex flex-col gap-2">
        {(q.data ?? []).map((r) => (
          <ReportItem key={r.id} r={r} />
        ))}
      </ul>
    </div>
  )
}

function ReportItem({ r }: { r: CastingReport }) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [restrict, setRestrict] = useState(false)
  const [err, setErr] = useState('')
  const resolve = useMutation({
    mutationFn: (status: 'RESOLVED' | 'DISMISSED') => adminCastingApi.resolve(r.id, status, note, restrict),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'casting'] }),
    onError: () => setErr('처리하지 못했습니다.'),
  })
  return (
    <li className="rounded-lg border bg-white p-3 text-sm" data-testid="casting-report">
      <p className="font-semibold">
        {koReportReason(r.reason)} · {r.agencyName ?? r.agencyUserId}
      </p>
      <p className="text-xs text-gray-600">
        신고자 {r.reporterName ?? '—'} · 제안 “{r.offerTitle ?? '—'}” · {r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : ''} · {r.status}
      </p>
      {r.detail ? <p className="mt-1 whitespace-pre-wrap">{r.detail}</p> : null}
      {r.resolutionNote ? <p className="mt-1 text-xs text-gray-600">처리 메모: {r.resolutionNote}</p> : null}
      {r.status === 'OPEN' ? (
        <div className="mt-2 flex flex-col gap-2">
          <input className="rounded border p-2" placeholder="처리 메모" value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={restrict} onChange={(e) => setRestrict(e.target.checked)} />이 기획사의 캐스팅 제안 제한
          </label>
          <div className="flex gap-2">
            <button type="button" className="rounded bg-gray-900 px-3 py-1.5 text-white" disabled={resolve.isPending} onClick={() => resolve.mutate('RESOLVED')}>
              조치 완료
            </button>
            <button type="button" className="rounded border px-3 py-1.5" disabled={resolve.isPending} onClick={() => resolve.mutate('DISMISSED')}>
              기각
            </button>
          </div>
          {err ? <p className="text-red-600">{err}</p> : null}
        </div>
      ) : null}
    </li>
  )
}

function Agencies() {
  const q = useQuery({ queryKey: ['admin', 'casting', 'agencies'], queryFn: adminCastingApi.agencies })
  return (
    <div className="overflow-x-auto rounded-lg border bg-white p-3">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="text-xs text-gray-500">
          <tr>
            <th>기획사</th>
            <th>승인</th>
            <th>30일 제안</th>
            <th>열린 신고</th>
            <th>플랜</th>
            <th>일일 한도</th>
            <th>제한</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((a) => (
            <AgencyRow key={a.agencyUserId} a={a} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AgencyRow({ a }: { a: AgencyControl }) {
  const qc = useQueryClient()
  const [restricted, setRestricted] = useState(a.restricted)
  const [limit, setLimit] = useState(a.dailyLimit == null ? '' : String(a.dailyLimit))
  const [reason, setReason] = useState(a.reason ?? '')
  const [msg, setMsg] = useState('')
  const save = useMutation({
    mutationFn: () => adminCastingApi.setControl(a.agencyUserId, restricted, reason, limit.trim() === '' ? null : Number(limit)),
    onSuccess: async () => {
      setMsg('저장됨')
      await qc.invalidateQueries({ queryKey: ['admin', 'casting'] })
    },
    onError: () => setMsg('실패'),
  })
  return (
    <tr className="border-t align-top">
      <td className="py-2">
        <p className="font-medium">{a.name ?? '—'}</p>
        <p className="text-xs text-gray-500">{a.email}</p>
      </td>
      <td>{a.approved ? '승인' : '미승인'}</td>
      <td>{a.sent30d}</td>
      <td>{a.openReports}</td>
      <td>{a.planCode}</td>
      <td>
        <input className="w-20 rounded border p-1" inputMode="numeric" placeholder="기본 20" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} />
      </td>
      <td>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
          제한
        </label>
        <input className="mt-1 w-40 rounded border p-1 text-xs" placeholder="사유" value={reason} onChange={(e) => setReason(e.target.value)} />
      </td>
      <td>
        <button type="button" className="rounded bg-gray-900 px-2 py-1 text-xs text-white" disabled={save.isPending} onClick={() => save.mutate()}>
          저장
        </button>
        {msg ? <span className="ml-1 text-xs">{msg}</span> : null}
      </td>
    </tr>
  )
}

function Moderation() {
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const qc = useQueryClient()
  const channels = useQuery({ queryKey: ['admin', 'casting', 'channels', term], queryFn: () => adminCastingApi.channels(term || undefined) })
  const videos = useQuery({ queryKey: ['admin', 'casting', 'videos', open], queryFn: () => adminCastingApi.videos(open as string), enabled: Boolean(open) })
  const hideChannel = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => adminCastingApi.moderateChannel(p.id, p.hidden, window.prompt('사유') ?? ''),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'casting'] }),
  })
  const hideVideo = useMutation({
    mutationFn: (p: { id: string; hidden: boolean }) => adminCastingApi.moderateVideo(p.id, p.hidden, window.prompt('사유') ?? ''),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'casting', 'videos'] }),
  })
  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setTerm(q.trim())
        }}
      >
        <input className="w-72 rounded border p-2 text-sm" placeholder="닉네임·이메일 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="rounded bg-gray-900 px-3 text-sm text-white">
          검색
        </button>
      </form>
      <ul className="flex flex-col gap-2">
        {(channels.data ?? []).map((c) => (
          <li key={c.userId} className="rounded-lg border bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>{c.nickname ?? '—'}</strong> <span className="text-xs text-gray-500">{c.email}</span> · 영상 {c.videos} · {c.publicChannel ? '공개' : '비공개'}
                {c.hidden ? <span className="ml-1 text-red-600">운영 숨김</span> : null}
              </span>
              <span className="flex gap-2">
                <Link href={`/ko/channel/${c.userId}`} className="rounded border px-2 py-1 text-xs" target="_blank">
                  채널
                </Link>
                <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => setOpen(open === c.userId ? null : c.userId)}>
                  영상
                </button>
                <button type="button" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700" onClick={() => hideChannel.mutate({ id: c.userId, hidden: !c.hidden })}>
                  {c.hidden ? '숨김 해제' : '채널 숨김'}
                </button>
              </span>
            </div>
            {open === c.userId ? (
              <ul className="mt-2 flex flex-col gap-1 border-t pt-2">
                {(videos.data ?? []).map((v) => (
                  <li key={v.videoId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate">
                      {v.title ?? '—'} · {v.visibility} · {v.embedStatus ?? 'UNKNOWN'} · 조회 {v.viewCount}
                      {v.hidden ? <span className="ml-1 text-red-600">숨김</span> : null}
                    </span>
                    <span className="flex gap-2">
                      {v.videoUrl ? (
                        <a href={v.videoUrl} target="_blank" rel="noreferrer" className="underline">
                          YouTube
                        </a>
                      ) : null}
                      <button type="button" className="rounded border px-2 py-0.5" onClick={() => hideVideo.mutate({ id: v.videoId, hidden: !v.hidden })}>
                        {v.hidden ? '숨김 해제' : '숨김'}
                      </button>
                    </span>
                  </li>
                ))}
                {videos.data && videos.data.length === 0 ? <li className="text-xs text-gray-500">영상 없음</li> : null}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
