'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  POST_SELECTION_ACTIVITIES,
  REQUIREMENT_STATUSES,
  adminMinorPolicyApi,
  type CountryMinorPolicy,
} from '@/shared/api/adminMinorPolicy'
import { koCountry } from '@/components/casting/agencyKo'

type Tab = 'countries' | 'summary' | 'user'
const TABS: [Tab, string][] = [
  ['countries', '국가별 정책'],
  ['summary', '동의 현황'],
  ['user', '회원 조회'],
]

const KO_CONSENT: Record<string, string> = {
  TERMS_OF_SERVICE: '서비스 이용약관',
  PRIVACY_COLLECTION: '개인정보 수집·이용',
  PRIVACY_DISCLOSURE: '개인정보 공개 범위',
  GUARDIAN_CONSENT: '보호자 동의',
  MARKETING: '마케팅 수신',
}
const KO_STATUS: Record<string, string> = {
  AGREED: '동의',
  WITHDRAWN: '철회',
  PENDING: '확인 대기',
  CONFIRMED: '확인 완료',
  REVOKED: '철회됨',
  EXPIRED: '만료',
  CANCELLED: '취소',
  REQUIRED: '필요',
  IN_PROGRESS: '진행 중',
  SATISFIED: '충족',
  NOT_REQUIRED: '불필요',
}
const KO_SOURCE: Record<string, string> = { SIGNUP: '가입', SETTINGS: '설정', GUARDIAN_LINK: '보호자 링크', ADMIN: '관리자' }
const KO_ACTIVITY: Record<string, string> = {
  FINAL_CONTRACT: '최종 계약',
  EXCLUSIVE_CONTRACT: '전속 계약',
  TRAINEE_CONTRACT: '연습생 계약',
  IN_PERSON_AUDITION: '대면 오디션·미팅',
  OVERSEAS_TRAVEL: '해외 이동',
  TRAVEL_LODGING: '숙박 동반 일정',
  FILMING_PERFORMANCE: '촬영·공연 출연',
  PORTRAIT_CONTENT_RIGHTS: '초상권·콘텐츠 이용',
  OTHER_GUARDIAN_REQUIRED: '기타 보호자 동의 필요',
}
const ko = (m: Record<string, string>, k: string | null | undefined) => (k ? m[k] ?? k : '—')
const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '—')
const errText = (e: unknown) => {
  if (axios.isAxiosError(e)) {
    const m = (e.response?.data as { message?: unknown } | undefined)?.message
    if (typeof m === 'string' && m) return m
  }
  return '처리하지 못했습니다.'
}

export default function SuperAdminMinorPolicyPage() {
  const [tab, setTab] = useState<Tab>('countries')
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">미성년자 정책·동의</h1>
        <p className="mt-1 text-sm text-gray-600">
          나이 기준은 코드에 고정하지 않고 국가별로 관리합니다. 정책에 없는 국가는 DEFAULT 를 씁니다. 모든 변경은{' '}
          <Link href="/admin/super/logs" className="underline">
            감사 로그
          </Link>
          에 남습니다. 기존 회원의 동의 기록은 임의로 만들지 않습니다.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${tab === k ? 'bg-[#3B82F6] text-white' : 'border bg-white'}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'countries' ? <Countries /> : null}
      {tab === 'summary' ? <Summary /> : null}
      {tab === 'user' ? <UserLookup /> : null}
    </div>
  )
}

function Countries() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin', 'minor-policy', 'countries'], queryFn: adminMinorPolicyApi.countries })
  const [newCode, setNewCode] = useState('')
  if (q.isLoading) return <p className="text-sm">불러오는 중…</p>
  if (q.isError) return <p className="text-sm text-red-600">정책을 불러오지 못했습니다.</p>
  const rows = q.data ?? []
  const base = rows.find((r) => r.countryCode === 'DEFAULT')
  return (
    <div className="flex flex-col gap-3" data-testid="minor-policy-countries">
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="p-2">국가</th>
              <th className="p-2">성년 나이</th>
              <th className="p-2">보호자 동의 필요(미만)</th>
              <th className="p-2">지원 시 보호자 확인</th>
              <th className="p-2">제안 수신 시 보호자 확인</th>
              <th className="p-2">미성년 연락처 공유 허용</th>
              <th className="p-2">메모</th>
              <th className="p-2">수정일</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <PolicyRow key={r.countryCode} row={r} onSaved={() => void qc.invalidateQueries({ queryKey: ['admin', 'minor-policy'] })} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          className="h-9 w-24 rounded border px-2 uppercase"
          placeholder="국가 코드"
          maxLength={2}
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
        />
        <button
          type="button"
          className="rounded-md border bg-white px-3 py-1.5"
          disabled={!/^[A-Z]{2}$/.test(newCode) || rows.some((r) => r.countryCode === newCode)}
          onClick={async () => {
            try {
              await adminMinorPolicyApi.save(newCode, {
                adultAge: base?.adultAge ?? 18,
                guardianConsentUnderAge: base?.guardianConsentUnderAge ?? 18,
                guardianRequiredForApply: base?.guardianRequiredForApply ?? true,
                minorOffersRequireGuardian: base?.minorOffersRequireGuardian ?? true,
                minorContactSharingAllowed: false,
                note: 'DEFAULT 값으로 추가 — 법무 확인 필요',
              })
              setNewCode('')
              await qc.invalidateQueries({ queryKey: ['admin', 'minor-policy'] })
            } catch (e) {
              window.alert(errText(e))
            }
          }}
        >
          국가 정책 추가 (DEFAULT 복사)
        </button>
      </div>
      <p className="text-xs text-gray-500">
        시드 값(KR 19/14, US 18/13, 그 외 18/18)은 운영 초기값이며 국가별 법무 확인이 필요합니다. 보호자 확인 방식은 현재 공유 링크(비용 없음)만 지원합니다.
      </p>
    </div>
  )
}

function PolicyRow({ row, onSaved }: { row: CountryMinorPolicy; onSaved: () => void }) {
  const [d, setD] = useState(row)
  useEffect(() => setD(row), [row])
  const save = useMutation({
    mutationFn: () =>
      adminMinorPolicyApi.save(row.countryCode, {
        adultAge: Number(d.adultAge),
        guardianConsentUnderAge: Number(d.guardianConsentUnderAge),
        guardianRequiredForApply: d.guardianRequiredForApply,
        minorOffersRequireGuardian: d.minorOffersRequireGuardian,
        minorContactSharingAllowed: d.minorContactSharingAllowed,
        note: d.note ?? '',
      }),
    onSuccess: onSaved,
    onError: (e) => window.alert(errText(e)),
  })
  const dirty = JSON.stringify(d) !== JSON.stringify(row)
  const num = (k: 'adultAge' | 'guardianConsentUnderAge') => (
    <input
      type="number"
      min={0}
      max={30}
      className="h-8 w-16 rounded border px-2"
      value={d[k]}
      onChange={(e) => setD({ ...d, [k]: Number(e.target.value) })}
    />
  )
  const chk = (k: 'guardianRequiredForApply' | 'minorOffersRequireGuardian' | 'minorContactSharingAllowed') => (
    <input type="checkbox" checked={d[k]} onChange={() => setD({ ...d, [k]: !d[k] })} />
  )
  return (
    <tr className="border-t" data-testid={`policy-${row.countryCode}`}>
      <td className="p-2 font-medium">{row.countryCode === 'DEFAULT' ? '기본(DEFAULT)' : `${koCountry(row.countryCode)} (${row.countryCode})`}</td>
      <td className="p-2">{num('adultAge')}</td>
      <td className="p-2">{num('guardianConsentUnderAge')}</td>
      <td className="p-2">{chk('guardianRequiredForApply')}</td>
      <td className="p-2">{chk('minorOffersRequireGuardian')}</td>
      <td className="p-2">{chk('minorContactSharingAllowed')}</td>
      <td className="p-2">
        <input className="h-8 w-48 rounded border px-2" value={d.note ?? ''} onChange={(e) => setD({ ...d, note: e.target.value })} />
      </td>
      <td className="p-2 text-xs text-gray-500">{when(row.updatedAt)}</td>
      <td className="p-2">
        <button
          type="button"
          disabled={!dirty || save.isPending}
          className="rounded-md bg-[#3B82F6] px-3 py-1 text-xs text-white disabled:opacity-40"
          onClick={() => save.mutate()}
        >
          저장
        </button>
      </td>
    </tr>
  )
}

function Summary() {
  const q = useQuery({ queryKey: ['admin', 'minor-policy', 'summary'], queryFn: adminMinorPolicyApi.summary })
  if (q.isLoading) return <p className="text-sm">불러오는 중…</p>
  if (q.isError || !q.data) return <p className="text-sm text-red-600">현황을 불러오지 못했습니다.</p>
  const s = q.data
  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="minor-policy-summary">
      <section className="rounded-lg border bg-white p-3">
        <h2 className="text-sm font-semibold">동의 유형별 최신 상태(회원 수)</h2>
        <ul className="mt-2 text-sm">
          {Object.entries(s.consents).map(([type, by]) => (
            <li key={type} className="flex justify-between border-b py-1">
              <span>{ko(KO_CONSENT, type)}</span>
              <span>
                {Object.entries(by)
                  .map(([st, n]) => `${ko(KO_STATUS, st)} ${n}`)
                  .join(' · ')}
              </span>
            </li>
          ))}
          {Object.keys(s.consents).length === 0 ? <li className="py-1 text-gray-500">기록 없음</li> : null}
        </ul>
      </section>
      <section className="rounded-lg border bg-white p-3">
        <h2 className="text-sm font-semibold">보호자 확인</h2>
        <ul className="mt-2 text-sm">
          {Object.entries(s.guardians).map(([st, n]) => (
            <li key={st} className="flex justify-between border-b py-1">
              <span>{ko(KO_STATUS, st)}</span>
              <span>{n}</span>
            </li>
          ))}
          {Object.keys(s.guardians).length === 0 ? <li className="py-1 text-gray-500">기록 없음</li> : null}
        </ul>
        <p className="mt-3 text-sm">동의 기록이 없는 기존 회원: {s.membersWithoutConsentRecords}명 (임의 생성하지 않음)</p>
        <p className="mt-1 text-sm">진행 중인 선발 이후 동의 요건: {s.requirementsOpen}건</p>
      </section>
    </div>
  )
}

function UserLookup() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState('')
  const q = useQuery({
    queryKey: ['admin', 'minor-policy', 'user', userId],
    queryFn: () => adminMinorPolicyApi.user(userId),
    enabled: /^[0-9a-f-]{36}$/i.test(userId),
    retry: false,
  })
  const [activity, setActivity] = useState<string>('FINAL_CONTRACT')
  const [appId, setAppId] = useState('')
  const [note, setNote] = useState('')
  const [fixBirth, setFixBirth] = useState('')
  const [fixReason, setFixReason] = useState('')
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'minor-policy'] })
  const u = q.data
  const minor = (u?.minor ?? {}) as Record<string, unknown>
  return (
    <div className="flex flex-col gap-3" data-testid="minor-policy-user">
      <div className="flex flex-wrap gap-2">
        <input
          className="h-9 w-[360px] rounded border px-2 text-sm"
          placeholder="회원 ID (UUID)"
          value={input}
          onChange={(e) => setInput(e.target.value.trim())}
        />
        <button type="button" className="rounded-md bg-[#3B82F6] px-3 py-1.5 text-sm text-white" onClick={() => setUserId(input)}>
          조회
        </button>
      </div>
      {q.isError ? <p className="text-sm text-red-600">회원을 찾지 못했습니다.</p> : null}
      {u ? (
        <>
          <section className="rounded-lg border bg-white p-3 text-sm">
            <p>
              <b>{u.nickname ?? '—'}</b> · 가입 국가 {u.countryCode ? koCountry(u.countryCode) : '—'} · 생년월일 {u.birthDateSet ? '입력됨' : '없음'}
            </p>
            <p className="mt-1 text-gray-600">
              적용 정책 {String(minor.policyCountry ?? '—')} · 미성년자 {minor.minor ? '예' : '아니오'} · 보호자 동의 법정 필요{' '}
              {minor.guardianLegallyRequired ? '예' : '아니오'} · 보호자 확인 {minor.guardianConfirmed ? '완료' : '미완료'}
            </p>
            <p className="mt-1 text-gray-600">
              지원 {minor.applyAllowed ? '가능' : '제한'} · 검색 노출 {minor.searchAllowed ? '가능' : '제한'} · 제안 수신{' '}
              {minor.offersAllowed ? '가능' : '제한'} · 연락처 공유 {minor.contactSharingAllowed ? '가능' : '제한'}
            </p>
          </section>
          <section className="rounded-lg border bg-white p-3" data-testid="birth-date-correction">
            <h2 className="text-sm font-semibold">생년월일 정정</h2>
            <p className="mt-1 text-xs text-gray-500">
              회원은 생년월일을 직접 바꿀 수 없습니다. 본인 확인 후에만 정정하세요. 변경 전·후·사유·처리 관리자·일시가 감사 로그에 남고 연령 정책이 다시 적용됩니다.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <input type="date" className="h-9 rounded border px-2" value={fixBirth} onChange={(e) => setFixBirth(e.target.value)} />
              <input className="h-9 w-72 rounded border px-2" placeholder="정정 사유 (필수)" value={fixReason} onChange={(e) => setFixReason(e.target.value)} />
              <button
                type="button"
                className="rounded-md bg-[#3B82F6] px-3 py-1.5 text-white disabled:opacity-40"
                disabled={!fixBirth || fixReason.trim().length < 2}
                onClick={async () => {
                  if (!window.confirm(`생년월일을 ${fixBirth} 로 정정할까요?`)) return
                  try {
                    const r = await adminMinorPolicyApi.correctBirthDate(u.userId, fixBirth, fixReason.trim())
                    window.alert(`정정했습니다: ${r.before ?? '없음'} → ${r.after}`)
                    setFixBirth('')
                    setFixReason('')
                    await refresh()
                  } catch (e) {
                    window.alert(errText(e))
                  }
                }}
              >
                정정
              </button>
            </div>
          </section>
          <section className="rounded-lg border bg-white p-3">
            <h2 className="text-sm font-semibold">동의 이력</h2>
            <ul className="mt-2 text-xs">
              {u.history.map((c, i) => (
                <li key={i} className="border-b py-1">
                  {ko(KO_CONSENT, c.type)} · {ko(KO_STATUS, c.status)} · {ko(KO_SOURCE, c.source)} · 버전 {c.termsVersion ?? '—'} · {when(c.createdAt)}
                </li>
              ))}
              {u.history.length === 0 ? <li className="py-1 text-gray-500">기록 없음</li> : null}
            </ul>
          </section>
          <section className="rounded-lg border bg-white p-3">
            <h2 className="text-sm font-semibold">보호자 확인 기록</h2>
            <ul className="mt-2 text-xs">
              {u.guardians.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-1">
                  <span>
                    {ko(KO_STATUS, g.status)} · {g.guardianName ?? '—'} · {g.relationship ?? '—'} · {g.guardianEmailMasked ?? '이메일 없음'} · 요청{' '}
                    {when(g.requestedAt)} · 확인 {when(g.confirmedAt)}
                  </span>
                  {g.status === 'CONFIRMED' ? (
                    <button
                      type="button"
                      className="rounded border px-2 py-0.5"
                      onClick={async () => {
                        if (!window.confirm('보호자 동의를 철회 처리할까요? 검색 노출·제안 수신이 정책에 맞게 꺼집니다.')) return
                        try {
                          await adminMinorPolicyApi.revokeGuardian(g.id)
                          await refresh()
                        } catch (e) {
                          window.alert(errText(e))
                        }
                      }}
                    >
                      철회 처리
                    </button>
                  ) : null}
                </li>
              ))}
              {u.guardians.length === 0 ? <li className="py-1 text-gray-500">기록 없음</li> : null}
            </ul>
          </section>
          <section className="rounded-lg border bg-white p-3">
            <h2 className="text-sm font-semibold">선발 이후 활동별 동의 요건</h2>
            <p className="mt-1 text-xs text-gray-500">계약서·양식은 만들지 않고 요건 상태만 관리합니다.</p>
            <ul className="mt-2 text-xs">
              {u.requirements.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-1">
                  <span>
                    {ko(KO_ACTIVITY, r.activityType)} · 보호자 {r.guardianRequired ? '필요' : '불필요'} · {r.note ?? ''}
                  </span>
                  <select
                    className="rounded border px-1 py-0.5"
                    value={r.status}
                    onChange={async (e) => {
                      try {
                        await adminMinorPolicyApi.setRequirementStatus(r.id, e.target.value)
                        await refresh()
                      } catch (err) {
                        window.alert(errText(err))
                      }
                    }}
                  >
                    {REQUIREMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {ko(KO_STATUS, st)}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
              {u.requirements.length === 0 ? <li className="py-1 text-gray-500">등록된 요건 없음</li> : null}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <select className="h-9 rounded border px-2" value={activity} onChange={(e) => setActivity(e.target.value)}>
                {POST_SELECTION_ACTIVITIES.map((a) => (
                  <option key={a} value={a}>
                    {ko(KO_ACTIVITY, a)}
                  </option>
                ))}
              </select>
              <input className="h-9 w-72 rounded border px-2" placeholder="지원서 ID (선택)" value={appId} onChange={(e) => setAppId(e.target.value.trim())} />
              <input className="h-9 w-48 rounded border px-2" placeholder="메모" value={note} onChange={(e) => setNote(e.target.value)} />
              <button
                type="button"
                className="rounded-md bg-[#3B82F6] px-3 py-1.5 text-white"
                onClick={async () => {
                  try {
                    await adminMinorPolicyApi.createRequirement({
                      userId: u.userId,
                      applicationId: appId || undefined,
                      activityType: activity,
                      note: note || undefined,
                    })
                    setNote('')
                    setAppId('')
                    await refresh()
                  } catch (e) {
                    window.alert(errText(e))
                  }
                }}
              >
                요건 등록
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
