'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orgCopy } from '@/app/admin/org/copy'
import {
  orgAdminApi,
  orgErrorMessage,
  type AccountPrefs,
  type ActivityRow,
  type AgencyRow,
  type AuditionOps,
  type CountryMetrics,
  type UsagePoint,
} from '@/shared/api/orgAdmin'
import { apiClient } from '@/shared/api/client'
import { userApi } from '@/shared/api/user'
import { formatCount, formatUsdAmount } from '@/shared/money/currency'

type Locale = 'ko' | 'ja' | 'en'
type SortDir = 'asc' | 'desc'

export function useCountrySession() {
  const me = useQuery({ queryKey: ['currentUser'], queryFn: () => userApi.getCurrentUser() })
  const countries = useQuery({ queryKey: ['org', 'countries'], queryFn: () => orgAdminApi.countries() })
  const account = useQuery({ queryKey: ['org', 'account'], queryFn: () => orgAdminApi.account() })
  const code = countries.data?.[0]?.code?.trim() ?? ''
  const staff = me.data?.role === 'COUNTRY_STAFF'
  const locale = (account.data?.locale ?? 'ko') as Locale
  return { me, countries, account, code, staff, locale, country: countries.data?.[0] }
}

export function label(locale: Locale, key: keyof typeof orgCopy.ko): string {
  const localized = orgCopy[locale] as Partial<Record<keyof typeof orgCopy.ko, string>>
  return localized[key] ?? orgCopy.ko[key]
}

export function usd(value: number | string | null | undefined, locale = 'en'): string {
  return formatUsdAmount(value, locale)
}

export function count(value: number | string | null | undefined, locale = 'en'): string {
  return formatCount(value, locale)
}

function formatCell(value: unknown): string {
  if (typeof value === 'number') return formatCount(value, 'en')
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded border bg-white p-4">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function StateLine({
  loading,
  error,
  empty,
}: {
  loading: boolean
  error: unknown
  empty: boolean
}) {
  if (loading) return <p className="text-sm text-gray-500">불러오는 중…</p>
  if (error) return <p className="text-sm text-red-700">{orgErrorMessage(error)}</p>
  if (empty) return <p className="text-sm text-gray-500">표시할 항목이 없습니다.</p>
  return null
}

export function DataTable<T>({
  rows,
  columns,
}: {
  rows: T[]
  columns: { key: string; header: string; value: (row: T) => string | number | null | undefined; render?: (row: T) => React.ReactNode }[]
}) {
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? '')
  const [dir, setDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)
  const pageSize = 10
  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey) ?? columns[0]
    const copy = [...rows]
    copy.sort((a, b) => {
      const left = String(column.value(a) ?? '')
      const right = String(column.value(b) ?? '')
      const numeric = Number(left)
      const other = Number(right)
      const compared = !Number.isNaN(numeric) && !Number.isNaN(other) && left !== '' && right !== ''
        ? numeric - other
        : left.localeCompare(right)
      return dir === 'asc' ? compared : -compared
    })
    return copy
  }, [rows, columns, sortKey, dir])
  const slice = sorted.slice(page * pageSize, page * pageSize + pageSize)
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th key={column.key} className="py-2 pr-3">
                  <button
                    type="button"
                    className="font-semibold"
                    onClick={() => {
                      setPage(0)
                      if (sortKey === column.key) setDir(dir === 'asc' ? 'desc' : 'asc')
                      else {
                        setSortKey(column.key)
                        setDir('asc')
                      }
                    }}
                  >
                    {column.header}
                    {sortKey === column.key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, index) => (
              <tr key={index} className="border-b align-top">
                {columns.map((column) => (
                  <td key={column.key} className="py-2 pr-3">
                    {column.render ? column.render(row) : formatCell(column.value(row))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <button type="button" className="rounded border px-2 py-1" disabled={page === 0} onClick={() => setPage(page - 1)}>
          이전
        </button>
        <span>
          {page + 1} / {pages}
        </span>
        <button type="button" className="rounded border px-2 py-1" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
          다음
        </button>
      </div>
    </div>
  )
}

export function DashboardScreen() {
  const { code, staff, locale, country, me } = useCountrySession()
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const metrics = useQuery({
    queryKey: ['org', 'metrics', code, period],
    queryFn: () => orgAdminApi.metrics(code, period),
    enabled: code.length === 2,
  })
  const log = useQuery({
    queryKey: ['org', 'activity', code],
    queryFn: () => orgAdminApi.activityLog(code),
    enabled: code.length === 2,
  })
  const data = metrics.data
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{label(locale, 'dashboard')}</h1>
      <p className="mb-4 text-sm text-gray-600">
        {country?.name ?? '국가 없음'} ({code || '—'}) · 담당 {data?.representativeName ?? '미지정'} · 로그인 {me.data?.displayName ?? me.data?.email}
      </p>
      <label className="mb-4 block text-sm">
        조회 기간 (UTC)
        <input className="ml-2 rounded border px-3 py-2" aria-label="대시보드 기간" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </label>
      <StateLine loading={metrics.isLoading} error={metrics.error} empty={!metrics.isLoading && !data} />
      {data ? <MetricGrid metrics={data} staff={staff} locale={locale} /> : null}
      <Panel title="최근 영업 활동">
        <StateLine loading={log.isLoading} error={log.error} empty={(log.data ?? []).length === 0} />
        <ul className="space-y-2 text-sm">
          {(log.data ?? []).slice(0, 8).map((row) => (
            <li key={row.id}>
              {row.createdAt?.slice(0, 16)} · {row.kind} · {row.body}
              {row.followUpOn ? ` · 다음 ${row.followUpOn}` : ''}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function MetricGrid({ metrics, staff, locale }: { metrics: CountryMetrics; staff: boolean; locale: Locale }) {
  const cards: { label: string; value: string }[] = [
    { label: '등록 기획사', value: count(metrics.agenciesRegistered, locale) },
    { label: '승인 기획사', value: count(metrics.agenciesApproved, locale) },
    { label: '진행 오디션', value: count(metrics.liveAuditions, locale) },
    { label: '이번 달 지원', value: count(metrics.monthlyApplications, locale) },
    { label: '이번 달 수수료 실적', value: usd(metrics.feePerformanceUsd, locale) },
    { label: '무료 사용', value: count(metrics.freeUsageCredits, locale) },
    { label: '유료 사용', value: count(metrics.paidUsageCredits, locale) },
    { label: '검토 필요', value: count(metrics.reviewCredits, locale) },
    { label: '승인 대기', value: count(metrics.pendingApprovals, locale) },
  ]
  if (!staff) {
    const lastMonth = metrics.lastMonthPeriod ?? '지난 달'
    const selected = metrics.period ?? '선택 월'
    cards.push(
      { label: '환불', value: usd(metrics.refundsUsd, locale) },
      { label: '정산 베이스', value: usd(metrics.settlementBaseUsd, locale) },
      { label: '현재 요율(bps)', value: metrics.rateBps == null ? '미정' : count(metrics.rateBps, locale) },
      { label: `${label(locale, 'expected')} · ${selected}`, value: metrics.expectedCompensation == null ? '미계산' : usd(metrics.expectedCompensation, locale) },
      { label: `확정 · ${selected}`, value: metrics.confirmedCompensation == null ? '없음' : usd(metrics.confirmedCompensation, locale) },
      { label: `확정 · ${lastMonth}`, value: metrics.lastMonthConfirmedCompensation == null ? '없음' : usd(metrics.lastMonthConfirmedCompensation, locale) },
    )
  }
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">{card.label}</p>
          <p className="mt-1 text-lg font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  )
}

export function AgenciesScreen({ detailId }: { detailId?: string }) {
  const { code, locale } = useCountrySession()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const agencies = useQuery({
    queryKey: ['org', 'agencies', code],
    queryFn: () => orgAdminApi.agencies(code),
    enabled: code.length === 2,
  })
  const rows = (agencies.data ?? []).filter((row) => {
    const text = `${row.displayName} ${row.legalName ?? ''} ${row.stage}`.toLowerCase()
    const matchesQuery = query.trim() === '' || text.includes(query.trim().toLowerCase())
    const matchesStatus = status === 'ALL' || row.approvalState === status
    return matchesQuery && matchesStatus
  })
  const selected = detailId ? (agencies.data ?? []).find((row) => row.id === detailId) : undefined
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{label(locale, 'agencyMenu')}</h1>
      {detailId ? (
        <Link href="/admin/country/agencies" className="mb-4 inline-block text-sm text-violet-700 underline">
          목록으로
        </Link>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="rounded border px-3 py-2" aria-label="기획사 검색" placeholder="이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="rounded border px-3 py-2" aria-label="승인 상태" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['ALL', 'PENDING', 'COUNTRY_REVIEW', 'HQ_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <StateLine loading={agencies.isLoading} error={agencies.error} empty={!agencies.isLoading && rows.length === 0} />
      {selected ? <AgencyDetail row={selected} /> : null}
      {!detailId && rows.length > 0 ? (
        <DataTable
          rows={rows}
          columns={[
            { key: 'name', header: '기획사', value: (row) => row.displayName, render: (row) => <Link className="underline" href={`/admin/country/agencies/${row.id}`}>{row.displayName}</Link> },
            { key: 'legal', header: '법인', value: (row) => row.legalName },
            { key: 'staff', header: '담당', value: (row) => row.assignedStaffUserId },
            { key: 'approval', header: '승인', value: (row) => row.approvalState },
            { key: 'stage', header: '단계', value: (row) => row.stage },
          ]}
        />
      ) : null}
    </div>
  )
}

function AgencyDetail({ row }: { row: AgencyRow }) {
  const auditions = useQuery({
    queryKey: ['org', 'auditions', row.countryCode],
    queryFn: () => orgAdminApi.auditions(row.countryCode),
  })
  const mine = (auditions.data ?? []).filter((item) => item.agencyId === row.id)
  return (
    <Panel title={row.displayName}>
      <p className="mb-3 text-sm">
        {row.legalName ?? '법인명 없음'} · {row.stage} · {row.approvalState}
      </p>
      <p className="mb-2 text-sm text-gray-600">이 기획사 오디션 {mine.length}건. 지원자 개인정보는 표시하지 않습니다.</p>
      <ul className="text-sm">
        {mine.map((item) => (
          <li key={item.id}>
            {item.title} · {item.status} · 지원 {count(item.applicants)} · 수수료 {usd(item.feeUsd)}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function CrmScreen() {
  const { code, locale } = useCountrySession()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [staffId, setStaffId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [stage, setStage] = useState('CONTACTED')
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const agencies = useQuery({ queryKey: ['org', 'agencies', code], queryFn: () => orgAdminApi.agencies(code), enabled: code.length === 2 })
  const log = useQuery({ queryKey: ['org', 'activity', code], queryFn: () => orgAdminApi.activityLog(code), enabled: code.length === 2 })
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ['org', 'agencies', code] })
    await qc.invalidateQueries({ queryKey: ['org', 'activity', code] })
  }
  const register = useMutation({
    mutationFn: () => orgAdminApi.registerAgency({
      countryCode: code,
      displayName: name,
      assignedStaffUserId: staffId || null,
      notes: '국가 화면에서 등록',
    }),
    onSuccess: async () => {
      setError(null)
      setName('')
      await refresh()
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const move = useMutation({
    mutationFn: () => orgAdminApi.changeStage(agencyId, stage, '단계 변경'),
    onSuccess: async () => {
      setError(null)
      await refresh()
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const [editId, setEditId] = useState('')
  const consult = useMutation({
    mutationFn: () => orgAdminApi.consult(agencyId, note, followUp || undefined),
    onSuccess: async () => {
      setError(null)
      setNote('')
      await refresh()
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const editConsult = useMutation({
    mutationFn: () => orgAdminApi.updateConsult(editId, note, followUp || undefined),
    onSuccess: async () => {
      setError(null)
      setEditId('')
      setNote('')
      await refresh()
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const followUps = (log.data ?? []).filter((row) => row.followUpOn)
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{label(locale, 'crm')}</h1>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <Panel title="리드 등록">
        <div className="flex flex-wrap gap-2">
          <input className="rounded border px-3 py-2" aria-label="리드 이름" placeholder="기획사 이름" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2" aria-label="담당 직원" placeholder="담당 직원 ID" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
          <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => register.mutate()}>등록</button>
        </div>
      </Panel>
      <Panel title="단계·상담·다음 일정">
        <div className="grid max-w-xl gap-2">
          <select className="rounded border px-3 py-2" aria-label="상담 기획사" value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
            <option value="">기획사 선택</option>
            {(agencies.data ?? []).map((row) => (
              <option key={row.id} value={row.id}>{row.displayName}</option>
            ))}
          </select>
          <select className="rounded border px-3 py-2" aria-label="단계" value={stage} onChange={(e) => setStage(e.target.value)}>
            {['LEAD', 'CONTACTED', 'MEETING', 'REVIEW', 'CONTRACTED', 'ACTIVE', 'STOPPED', 'DORMANT'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button type="button" className="w-fit rounded border px-3 py-2" onClick={() => move.mutate()}>단계 변경</button>
          <textarea className="rounded border px-3 py-2" aria-label="상담 내용" placeholder="상담 내용" value={note} onChange={(e) => setNote(e.target.value)} />
          <input className="rounded border px-3 py-2" aria-label="다음 상담일" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="w-fit rounded border px-3 py-2" onClick={() => consult.mutate()}>상담 기록</button>
            <button type="button" className="w-fit rounded border px-3 py-2" disabled={!editId} onClick={() => editConsult.mutate()}>상담 수정</button>
          </div>
          {editId ? <p className="text-xs text-gray-500">수정 중인 상담 {editId}</p> : null}
        </div>
      </Panel>
      <Panel title="다음 상담">
        <FollowList rows={followUps} />
      </Panel>
      <Panel title="상담 로그">
        <StateLine loading={log.isLoading} error={log.error} empty={(log.data ?? []).length === 0} />
        <FollowList
          rows={log.data ?? []}
          onEdit={(row) => {
            setEditId(row.id)
            setAgencyId(row.agencyId)
            setNote(row.body)
            setFollowUp(row.followUpOn ?? '')
          }}
        />
      </Panel>
    </div>
  )
}

function FollowList({ rows, onEdit }: { rows: ActivityRow[]; onEdit?: (row: ActivityRow) => void }) {
  if (rows.length === 0) return null
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center gap-2">
          <span>{row.followUpOn ?? row.createdAt?.slice(0, 10)} · {row.body}</span>
          {onEdit && row.kind === 'CONSULT' ? (
            <button type="button" className="underline" onClick={() => onEdit(row)}>수정</button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function ApprovalsScreen() {
  const { code, staff, locale } = useCountrySession()
  const qc = useQueryClient()
  const [agencyId, setAgencyId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const agencies = useQuery({ queryKey: ['org', 'agencies', code], queryFn: () => orgAdminApi.agencies(code), enabled: code.length === 2 })
  const pending = (agencies.data ?? []).filter((row) => ['PENDING', 'COUNTRY_REVIEW', 'HQ_REVIEW'].includes(row.approvalState))
  const act = useMutation({
    mutationFn: (action: string) => orgAdminApi.decide(agencyId, action, reason),
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['org', 'agencies', code] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  if (staff) return <p className="text-sm">기획사 승인 검토는 국가 관리자 화면입니다. 직원은 등록과 상담을 돕습니다.</p>
  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{label(locale, 'approvals')}</h1>
      <p className="mb-4 text-sm text-gray-600">최종 승인은 본사만 합니다. 이 화면은 접수, 보완, 본사 요청, 반려 요청만 합니다.</p>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <StateLine loading={agencies.isLoading} error={agencies.error} empty={!agencies.isLoading && pending.length === 0} />
      <div className="mb-4 grid max-w-xl gap-2">
        <select className="rounded border px-3 py-2" aria-label="검토 기획사" value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
          <option value="">기획사 선택</option>
          {pending.map((row) => (
            <option key={row.id} value={row.id}>{row.displayName} · {row.approvalState}</option>
          ))}
        </select>
        <input className="rounded border px-3 py-2" aria-label="검토 사유" placeholder="검토 메모" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-3 py-2" onClick={() => act.mutate('SUBMIT')}>접수</button>
          <button type="button" className="rounded border px-3 py-2" onClick={() => act.mutate('SUPPLEMENT')}>보완 요청</button>
          <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => act.mutate('RECOMMEND')}>본사 승인 요청</button>
          <button type="button" className="rounded border px-3 py-2" onClick={() => act.mutate('COUNTRY_REJECT')}>반려 요청</button>
        </div>
      </div>
      {pending.length > 0 ? (
        <DataTable
          rows={pending}
          columns={[
            { key: 'name', header: '기획사', value: (row) => row.displayName },
            { key: 'state', header: '본사 결과 대기', value: (row) => row.approvalState },
            { key: 'stage', header: '단계', value: (row) => row.stage },
          ]}
        />
      ) : null}
    </div>
  )
}

export function AuditionsScreen() {
  const { code, locale } = useCountrySession()
  const rows = useQuery({ queryKey: ['org', 'auditions', code], queryFn: () => orgAdminApi.auditions(code), enabled: code.length === 2 })
  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{label(locale, 'auditions')}</h1>
      <p className="mb-4 text-sm text-gray-600">지원자 개인정보와 개별 심사 데이터는 표시하지 않습니다.</p>
      <StateLine loading={rows.isLoading} error={rows.error} empty={(rows.data ?? []).length === 0} />
      {(rows.data ?? []).length > 0 ? (
        <DataTable
          rows={rows.data as AuditionOps[]}
          columns={[
            { key: 'title', header: '오디션', value: (row) => row.title },
            { key: 'agency', header: '기획사', value: (row) => row.agencyName },
            { key: 'status', header: '상태', value: (row) => row.status },
            { key: 'start', header: '시작', value: (row) => row.startAt },
            { key: 'end', header: '종료', value: (row) => row.endAt },
            { key: 'applicants', header: '지원 수', value: (row) => row.applicants },
            { key: 'fee', header: '수수료', value: (row) => row.feeUsd, render: (row) => usd(row.feeUsd) },
            { key: 'judging', header: '심사 집계', value: (row) => row.judgingStatus },
          ]}
        />
      ) : null}
    </div>
  )
}

export function StaffScreen() {
  const { code, staff, locale } = useCountrySession()
  const qc = useQueryClient()
  const [userId, setUserId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const rows = useQuery({ queryKey: ['org', 'staff', code], queryFn: () => orgAdminApi.staff(code), enabled: code.length === 2 && !staff })
  const refresh = async () => qc.invalidateQueries({ queryKey: ['org', 'staff', code] })
  const add = useMutation({
    mutationFn: () => orgAdminApi.addStaff(code, userId, ['CRM_READ', 'CRM_WRITE', 'CONSULT_LOG', 'AGENCY_REVIEW']),
    onSuccess: async () => {
      setError(null)
      await refresh()
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const assign = useMutation({
    mutationFn: (id: string) => orgAdminApi.assignAgency(code, id, agencyId),
    onSuccess: async () => {
      setError(null)
      await refresh()
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const off = useMutation({
    mutationFn: (id: string) => orgAdminApi.deactivateStaff(code, id),
    onSuccess: refresh,
    onError: (err) => setError(orgErrorMessage(err)),
  })
  if (staff) return <p className="text-sm">직원 관리와 국가 요율은 국가 관리자만 볼 수 있습니다.</p>
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{label(locale, 'staff')}</h1>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="rounded border px-3 py-2" aria-label="직원 사용자 ID" placeholder="사용자 ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => add.mutate()}>직원 추가</button>
        <input className="rounded border px-3 py-2" aria-label="배정 기획사" placeholder="기획사 ID" value={agencyId} onChange={(e) => setAgencyId(e.target.value)} />
      </div>
      <StateLine loading={rows.isLoading} error={rows.error} empty={(rows.data ?? []).length === 0} />
      {(rows.data ?? []).length > 0 ? (
        <DataTable
          rows={rows.data ?? []}
          columns={[
            { key: 'name', header: '이름', value: (row) => row.displayName },
            { key: 'email', header: '이메일', value: (row) => row.email },
            { key: 'status', header: '상태', value: (row) => row.status },
            { key: 'perm', header: '권한', value: (row) => row.permissions.join(',') },
            { key: 'agencies', header: '기획사', value: (row) => row.agencyIds.length },
            {
              key: 'actions',
              header: '관리',
              value: (row) => row.status,
              render: (row) => (
                <span className="space-x-2">
                  <button type="button" className="underline" onClick={() => assign.mutate(row.userId)}>배정</button>
                  <button type="button" className="underline" onClick={() => off.mutate(row.userId)}>중지</button>
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  )
}

export function StatsScreen() {
  const { code, staff, locale } = useCountrySession()
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const usage = useQuery({
    queryKey: ['org', 'usage', code, period],
    queryFn: () => orgAdminApi.usage(code, period),
    enabled: code.length === 2,
  })
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{label(locale, 'stats')}</h1>
      <input className="mb-4 rounded border px-3 py-2" aria-label="통계 기간" value={period} onChange={(e) => setPeriod(e.target.value)} />
      <StateLine loading={usage.isLoading} error={usage.error} empty={(usage.data ?? []).length === 0} />
      {(usage.data ?? []).length > 0 ? (
        <DataTable
          rows={usage.data as UsagePoint[]}
          columns={[
            { key: 'day', header: '일자', value: (row) => row.day },
            { key: 'apps', header: '지원', value: (row) => row.applications },
            { key: 'free', header: '무료', value: (row) => row.freeCredits },
            { key: 'paid', header: '유료', value: (row) => row.paidCredits },
            { key: 'review', header: '검토 필요', value: (row) => row.reviewCredits },
            { key: 'base', header: staff ? '정산 베이스' : '정산 베이스', value: (row) => row.settleableUsd, render: (row) => (staff ? '비공개' : usd(row.settleableUsd)) },
          ]}
        />
      ) : null}
    </div>
  )
}

export function SettlementScreen() {
  const { code, staff, locale } = useCountrySession()
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const contracts = useQuery({ queryKey: ['org', 'contracts', code], queryFn: () => orgAdminApi.contracts(code), enabled: code.length === 2 && !staff })
  const stored = useQuery({ queryKey: ['org', 'settlements', code], queryFn: () => orgAdminApi.settlements(code), enabled: code.length === 2 && !staff })
  const active = (contracts.data ?? []).find((row) => row.status === 'ACTIVE')
  const monthRows = (stored.data ?? []).filter((row) => row.period === period)
  const preview = useQuery({
    queryKey: ['org', 'preview', code, active?.id, period],
    queryFn: () => orgAdminApi.previewSettlement(code, active!.id, period),
    enabled: Boolean(active?.id) && !staff,
  })
  if (staff) return <p className="text-sm">국가 보상과 요율은 국가 관리자만 볼 수 있습니다.</p>
  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{label(locale, 'settlement')}</h1>
      <p className="mb-4 text-sm text-gray-600">{orgCopy.ko.readOnlySettlement}</p>
      <label className="mb-4 block text-sm">
        기간
        <input className="ml-2 rounded border px-3 py-2" aria-label="정산 기간" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </label>
      <Panel title={label(locale, 'expected')}>
        <StateLine loading={preview.isLoading} error={preview.error} empty={!active} />
        {preview.data ? (
          <p className="text-sm">
            예상 {usd(preview.data.compensationFinal)} · 상태 {preview.data.status} · 구분 {preview.data.figureKind} · 확정 행과 별도입니다.
          </p>
        ) : null}
      </Panel>
      <Panel title="월 정산 원장">
        <StateLine loading={stored.isLoading} error={stored.error} empty={false} />
        {stored.isLoading || stored.error ? null : monthRows.length === 0 ? (
          <p className="text-sm text-gray-500">{period} 확정 정산이 없습니다. 예상 보상과 확정·지급 상태는 다른 값입니다.</p>
        ) : (
          <DataTable
            rows={monthRows}
            columns={[
              { key: 'period', header: '기간', value: (row) => row.period },
              { key: 'status', header: '상태', value: (row) => row.status },
              { key: 'kind', header: '구분', value: () => 'STORED' },
              { key: 'comp', header: '확정 보상', value: (row) => row.compensationFinal ?? row.compensationUsd, render: (row) => usd(row.compensationFinal ?? row.compensationUsd) },
              { key: 'payout', header: '지급 기록', value: (row) => row.payoutNote },
              {
                key: 'csv',
                header: '명세서',
                value: (row) => row.id,
                render: (row) => (
                  <button
                    type="button"
                    className="underline"
                    onClick={async () => {
                      const csv = await orgAdminApi.statementCsv(row.id)
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `settlement-${row.period}.csv`
                      link.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    CSV
                  </button>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </div>
  )
}

export function ContractScreen() {
  const { code, staff, locale } = useCountrySession()
  const contracts = useQuery({ queryKey: ['org', 'contracts', code], queryFn: () => orgAdminApi.contracts(code), enabled: code.length === 2 && !staff })
  const rows = contracts.data ?? []
  const current = rows.find((row) => row.status === 'ACTIVE') ?? rows[0]
  const versions = useQuery({
    queryKey: ['org', 'versions', current?.id],
    queryFn: () => orgAdminApi.contractVersions(current!.id),
    enabled: Boolean(current?.id),
  })
  if (staff) return <p className="text-sm">계약 파일과 요율은 직원에게 열리지 않습니다.</p>
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{label(locale, 'myContract')}</h1>
      <StateLine loading={contracts.isLoading} error={contracts.error} empty={!current} />
      {current ? (
        <Panel title={current.contractNumber}>
          <p className="text-sm">
            상대 {current.counterpartyName} · 국가 {current.countryCode} · 상태 {current.status} · 기간 {current.startDate} ~ {current.endDate ?? '진행'} · 요율 {current.revenueShareBps == null ? '미정' : count(current.revenueShareBps, locale)} bps · 기준 {current.settlementBasis ?? '미정'}
          </p>
          <p className="mt-2 text-sm text-gray-600">전자서명은 없습니다. 서명본은 본사가 비공개 저장소에 첨부합니다.</p>
        </Panel>
      ) : null}
      {rows.length > 1 ? (
        <Panel title="계약 이력">
          <ul className="text-sm">
            {rows.map((row) => (
              <li key={row.id}>
                {row.contractNumber} · {row.status} · {row.startDate} ~ {row.endDate ?? '진행'}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {(versions.data ?? []).length > 0 ? (
        <DataTable
          rows={versions.data ?? []}
          columns={[
            { key: 'no', header: '버전', value: (row) => row.versionNo },
            { key: 'start', header: '시작', value: (row) => row.startDate },
            { key: 'end', header: '종료', value: (row) => row.endDate },
            { key: 'rate', header: '요율', value: (row) => row.revenueShareBps },
            { key: 'basis', header: '기준', value: (row) => row.settlementBasis },
          ]}
        />
      ) : null}
    </div>
  )
}

export function SettingsScreen() {
  const { me, locale } = useCountrySession()
  const qc = useQueryClient()
  const [nickname, setNickname] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [nextLocale, setNextLocale] = useState<AccountPrefs['locale']>(locale)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const saveProfile = useMutation({
    mutationFn: () => apiClient.patch('/me', { nickname }),
    onSuccess: async () => {
      setError(null)
      setMessage('프로필을 저장했습니다.')
      await qc.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const savePassword = useMutation({
    mutationFn: () => apiClient.patch('/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      setError(null)
      setMessage('비밀번호를 변경했습니다.')
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  const savePrefs = useMutation({
    mutationFn: () => orgAdminApi.saveAccount({ emailEnabled, locale: nextLocale }),
    onSuccess: async () => {
      setMessage('알림과 언어 설정을 저장했습니다.')
      await qc.invalidateQueries({ queryKey: ['org', 'account'] })
    },
    onError: (err) => setError(orgErrorMessage(err)),
  })
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{label(locale, 'settings')}</h1>
      <p className="mb-4 text-sm text-gray-600">{me.data?.email} · {me.data?.role}</p>
      {message ? <p className="mb-3 text-sm text-green-800">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <Panel title="프로필">
        <div className="flex gap-2">
          <input className="rounded border px-3 py-2" aria-label="닉네임" placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <button type="button" className="rounded border px-3 py-2" onClick={() => saveProfile.mutate()}>저장</button>
        </div>
      </Panel>
      <Panel title="비밀번호">
        <div className="grid max-w-md gap-2">
          <input className="rounded border px-3 py-2" aria-label="현재 비밀번호" type="password" placeholder="현재 비밀번호" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <input className="rounded border px-3 py-2" aria-label="새 비밀번호" type="password" placeholder="새 비밀번호" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="button" className="w-fit rounded border px-3 py-2" onClick={() => savePassword.mutate()}>변경</button>
        </div>
      </Panel>
      <Panel title="알림·언어">
        <label className="mb-2 block text-sm">
          <input type="checkbox" className="mr-2" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
          이메일 알림
        </label>
        <select className="rounded border px-3 py-2" aria-label="언어" value={nextLocale} onChange={(e) => setNextLocale(e.target.value as AccountPrefs['locale'])}>
          <option value="ko">한국어</option>
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
        <button type="button" className="ml-2 rounded border px-3 py-2" onClick={() => savePrefs.mutate()}>설정 저장</button>
        <p className="mt-2 text-xs text-gray-500">화면 문구는 ko/ja/en 카탈로그 키를 같이 씁니다. 본문은 한국어가 기본입니다.</p>
      </Panel>
    </div>
  )
}
