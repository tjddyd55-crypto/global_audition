'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { PointActivity, PointEntry, PointTotals } from '@/shared/audition/points'

type Settings = { enabled: boolean; earningEnabled: boolean; spendingEnabled: boolean; auditionEnabled: boolean; auditionCost: number }
type Rule = {
  id?: string; activity: PointActivity; countryCode: string; name: string; enabled: boolean; goal: number; award: number
  repeatable: boolean; dailyLimit: number; monthlyLimit: number; dailyEventLimit: number; monthlyPointLimit: number
  consecutive: boolean; profileFields: string[]; minAccountDays: number; startsAt: string | null; endsAt: string | null; revision: number
}
type Member = { userId: string; wallet: { balance: number; countryCode: string | null }; totals: PointTotals }
type Change = { scope: string; actorId: string; beforeConfig: string; afterConfig: string; changedAt: string }
type Cell = string | number
type Stats = { summary: Record<string, Cell>; activities: Record<string, Cell>[]; countries: Record<string, Cell>[]; days: Record<string, Cell>[]; months: Record<string, Cell>[] }

const root = '/admin/points'
const section = 'space-y-4 rounded-xl border bg-white p-4 sm:p-6'
const input = 'min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2'
const button = 'rounded-lg bg-violet-700 px-4 py-2 font-semibold text-white disabled:opacity-50'
const plain = 'rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50'
const switches = { enabled: '포인트 제도 활성화', earningEnabled: '신규 적립 허용', spendingEnabled: '보유 포인트 사용 허용', auditionEnabled: '오디션 포인트 지원 허용' } as const
const activityLabels: Record<PointActivity, string> = { DAILY_CHECK_IN:'일일 출석', MONTHLY_CHECK_IN:'월간 출석', LIKE_RECEIVED:'받은 영상 좋아요', LIKE_GIVEN:'영상 좋아요 참여', COMMENT:'댓글 작성', REFERRAL:'친구 초대', VIDEO:'채널 영상 등록', PUBLIC_VOTE:'공개 투표 참여', PROFILE:'프로필 작성 완료' }
const profileFields = { nickname:'닉네임', birthDate:'생년월일', countryCode:'국가', bio:'활동 소개', profileImageUrl:'프로필 사진', nationality:'국적', residenceCountry:'거주 국가', introText:'자기소개' }
const fields = {
  goal:'달성 목표', award:'지급 포인트', dailyLimit:'일일 최대 지급 횟수', monthlyLimit:'월간 최대 지급 횟수',
  dailyEventLimit:'일일 최대 인정 활동 수', monthlyPointLimit:'월간 최대 지급 포인트', minAccountDays:'초대 가입 최소 경과 일수',
} as const
const statLabels: Record<string, string> = {
  total_applications:'전체 지원', earned:'지급 포인트', used:'지원 사용 포인트', held:'회원 보유 포인트',
  point_applications:'포인트 지원', paid_applications:'유료 크레딧 지원', spending_members:'사용 회원', activity:'활동',
  points:'포인트', members:'참여 회원', country:'국가', event_day:'일자', period:'월',
}
const get = async <T,>(path: string) => (await apiClient.get<T>(root + path)).data
const put = async <T,>(path: string, body: T) => (await apiClient.put<T>(root + path, body)).data
const format = (n: number) => new Intl.NumberFormat('ko-KR').format(n)

export default function AdminActivityPoints() {
  const cache = useQueryClient()
  const settings = useQuery({ queryKey:['admin-points','settings'], queryFn:() => get<Settings>('/settings') })
  const policies = useQuery({ queryKey:['admin-points','policies'], queryFn:() => get<Rule[]>('/policies') })
  const stats = useQuery({ queryKey:['admin-points','stats'], queryFn:() => get<Stats>('/statistics') })
  const [historyPage, setHistoryPage] = useState(0)
  const history = useQuery({ queryKey:['admin-points','history',historyPage], queryFn:() => get<Change[]>('/history?page='+historyPage) })
  const [selection, setSelection] = useState<Rule | null>(null)
  const refresh = async () => { await cache.invalidateQueries({queryKey:['admin-points']}) }
  const saveSettings = useMutation({ mutationFn:(data:Settings) => put('/settings',data), onSuccess:refresh })
  const savePolicy = useMutation({
    mutationFn:(data:Rule) => put('/policies',data),
    onSuccess:async data => { setSelection(data); await refresh() },
  })
  return (
    <main className="mx-auto max-w-6xl space-y-5">
      <header><h1 className="text-2xl font-bold">포인트 관리</h1><p className="text-sm text-gray-600">적립 정책, 지원 사용 및 내부 원장을 관리합니다.</p></header>
      <section className={section}>
        <h2 className="text-lg font-bold">포인트 운영·사용 정책</h2>
        {settings.data ? <SettingsForm key={JSON.stringify(settings.data)} initial={settings.data} submit={d => saveSettings.mutate(d)} pending={saveSettings.isPending} /> : <p>설정을 불러오는 중입니다.</p>}
        {saveSettings.isSuccess ? <p role="status">운영 설정을 저장했습니다.</p> : null}
        {settings.isError || saveSettings.isError ? <p role="alert" className="text-red-700">운영 설정을 불러오거나 저장하지 못했습니다.</p> : null}
      </section>
      <section className={section}>
        <h2 className="text-lg font-bold">활동별 지급 정책</h2>
        <div className="flex flex-wrap gap-2">
          {policies.data?.map(rule => <button type="button" key={rule.id} className={plain} onClick={() => setSelection(rule)}>
            {activityLabels[rule.activity]} · {rule.countryCode || '공통'} · {rule.enabled ? '사용' : '중지'}
          </button>)}
        </div>
        {selection ? (
          <RuleForm key={(selection.id ?? selection.activity)+':'+selection.countryCode+':'+selection.revision} initial={selection}
            submit={rule => savePolicy.mutate(rule)} pending={savePolicy.isPending}
            countryOverride={() => setSelection({...selection, id:undefined, enabled:false, revision:0, countryCode:''})} />
        ) : <p className="text-sm">편집할 활동을 선택하세요.</p>}
        {savePolicy.isSuccess ? <p role="status">활동 정책을 저장했습니다.</p> : null}
        {policies.isError || savePolicy.isError ? <p role="alert" className="text-red-700">정책을 저장하지 못했습니다. 입력과 최신 수정본을 확인해 주세요.</p> : null}
      </section>
      <MemberSection />
      <section className={section}>
        <h2 className="text-lg font-bold">포인트 통계</h2>
        {stats.data ? <><StatsTable rows={[stats.data.summary]} />
          {([['활동별',stats.data.activities],['국가별',stats.data.countries],['일별',stats.data.days],['월별',stats.data.months]] as const).map(([title,rows]) => (
            <div key={title} className="space-y-2"><h3 className="font-semibold">{title}</h3><StatsTable rows={rows} /></div>
          ))}
        </> : <p>{stats.isError ? '통계를 불러오지 못했습니다.' : '통계를 불러오는 중입니다.'}</p>}
      </section>
      <section className={section}>
        <h2 className="text-lg font-bold">정책 수정 이력</h2>
        {history.data?.map(row => <details key={row.scope+row.changedAt} className="rounded border p-3">
          <summary className="break-all text-sm">{row.changedAt} · {row.scope} · {row.actorId}</summary>
          <pre className="overflow-auto text-xs">{JSON.stringify({ 이전:JSON.parse(row.beforeConfig), 이후:JSON.parse(row.afterConfig) },null,2)}</pre>
        </details>)}
        <Pagination page={historyPage} setPage={setHistoryPage} size={history.data?.length ?? 0} />
      </section>
    </main>
  )
}

function SettingsForm({ initial, submit, pending }: { initial: Settings; submit:(d:Settings)=>void; pending:boolean }) {
  const [data,setData] = useState(initial)
  return <form className="space-y-3" onSubmit={e => { e.preventDefault(); submit(data) }}>
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(switches).map(([key,label]) => <label className="flex items-center gap-2" key={key}>
        <input type="checkbox" checked={data[key as keyof typeof switches]} onChange={e=>setData({...data,[key]:e.target.checked})} />{label}
      </label>)}
    </div>
    <label className="block max-w-xs">지원 비용 (P)<input className={input} type="number" min={1} required value={data.auditionCost}
      onChange={e=>setData({...data,auditionCost:Number(e.target.value)})} /></label>
    <a className="mr-3 text-sm text-violet-700 underline" href="/admin/super/application-fee">기존 크레딧 지원비 설정</a>
    <button className={button} disabled={pending}>운영 설정 저장</button>
  </form>
}

function RuleForm({ initial, submit, pending, countryOverride }: { initial:Rule; submit:(d:Rule)=>void; pending:boolean; countryOverride:()=>void }) {
  const [rule,setRule] = useState(initial)
  const change = <K extends keyof Rule>(key:K,val:Rule[K]) => setRule(current=>({...current,[key]:val}))
  const dateInput = (value:string|null) => value ? value.slice(0,16) : ''
  function save(e:FormEvent) { e.preventDefault(); submit(rule) }
  return <form onSubmit={save} className="space-y-4 rounded-lg border p-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <label>정책명<input className={input} required maxLength={120} value={rule.name} onChange={e=>change('name',e.target.value)} /></label>
      <label>국가 코드 (공통은 공란)<input className={input} readOnly={!!rule.id} maxLength={2} pattern="[A-Za-z]{2}" required={!rule.id}
        value={rule.countryCode} onChange={e=>change('countryCode',e.target.value.toUpperCase())} /></label>
      {Object.entries(fields).filter(([key]) => key!=='minAccountDays' || rule.activity==='REFERRAL').map(([key,label]) => {
        const k = key as keyof typeof fields
        return <label key={key}>{label}<input className={input} type="number" min={k==='goal' || k==='award' || k==='minAccountDays'?1:0}
          max={k==='goal' && rule.activity==='MONTHLY_CHECK_IN'?28:undefined}
          required value={rule[k]} onChange={e=>change(k,Number(e.target.value))} /></label>
      })}
      {(['startsAt','endsAt'] as const).map(k => <label key={k}>{k==='startsAt'?'적용 시작 (UTC)':'적용 종료 (UTC)'}
        <input type="datetime-local" className={input} value={dateInput(rule[k])}
          onChange={e=>change(k,e.target.value ? new Date(e.target.value+'Z').toISOString() : null)} /></label>)}
    </div>
    <p className="text-xs text-gray-600">한도 0은 제한 없음입니다. 월간 출석 목표는 모든 달에 적용할 수 있도록 1~28일로 설정합니다.</p>
    <div className="flex flex-wrap gap-4">
      <label><input type="checkbox" checked={rule.enabled} onChange={e=>change('enabled',e.target.checked)} /> 사용</label>
      <label><input type="checkbox" disabled={rule.activity==='PROFILE'} checked={rule.repeatable} onChange={e=>change('repeatable',e.target.checked)} /> 반복 지급</label>
      {rule.activity==='MONTHLY_CHECK_IN' ? <label><input type="checkbox" checked={rule.consecutive} onChange={e=>change('consecutive',e.target.checked)} /> 연속 출석 기준</label> : null}
    </div>
    {rule.activity==='PROFILE' ? <fieldset className="flex flex-wrap gap-3"><legend>필수 프로필 항목</legend>
      {Object.entries(profileFields).map(([key,label])=> <label key={key}><input type="checkbox" checked={rule.profileFields.includes(key)}
        onChange={e=>change('profileFields',e.target.checked ? [...rule.profileFields,key] : rule.profileFields.filter(x=>x!==key))} /> {label}</label>)}
    </fieldset> : null}
    <div className="flex flex-wrap gap-2">
      <button className={button} disabled={pending}>활동 정책 저장</button>
      {rule.id ? <button className={plain} type="button" onClick={countryOverride}>국가별 설정 만들기</button> : null}
    </div>
  </form>
}

function MemberSection() {
  const cache = useQueryClient()
  const [id,setId] = useState('')
  const [selected,setSelected] = useState('')
  const [pages,setPages] = useState(0)
  const [delta,setDelta] = useState(0)
  const [reason,setReason] = useState('')
  const [revoke,setRevoke] = useState('')
  const [requestId,setRequestId] = useState<string | null>(null)
  const member = useQuery({queryKey:['admin-points','member',selected],queryFn:()=>get<Member>('/members/'+selected),enabled:!!selected,retry:false})
  const entries = useQuery({queryKey:['admin-points','entries',selected,pages],queryFn:()=>get<PointEntry[]>('/entries?page='+pages+(selected?'&userId='+selected:''))})
  const adjust = useMutation({
    mutationFn:async (id:string) => apiClient.post(root+'/adjustments',{userId:selected,requestId:id,amount:delta,reason,revokeEntryId:revoke||null}),
    onSuccess:async ()=>{ setRequestId(null); setReason(''); setDelta(0); setRevoke(''); await cache.invalidateQueries({queryKey:['admin-points']}) },
  })
  return <section className={section}>
    <h2 className="text-lg font-bold">회원별 관리 · 전체 거래 내역</h2>
    <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setSelected(id.trim());setPages(0);setRequestId(null)}}>
      <input className={input+' max-w-sm'} aria-label="회원 UUID" placeholder="회원 UUID" value={id} onChange={e=>setId(e.target.value)} pattern="[0-9A-Fa-f-]{36}" />
      <button className={plain}>조회</button>
      <a href="/admin/super/users" className={plain}>회원 찾기</a>
      {selected ? <button type="button" className={plain} onClick={()=>{setSelected('');setId('');setRevoke('');setPages(0)}}>전체 거래</button> : null}
    </form>
    {member.isError ? <p role="alert" className="text-red-700">회원을 조회하지 못했습니다.</p> : null}
    {member.data ? <form className="space-y-2 rounded border p-3" onSubmit={e=>{
      e.preventDefault();const key=requestId??crypto.randomUUID();setRequestId(key);adjust.mutate(key)
    }}>
      <p>보유 {format(member.data.wallet.balance)} P · 총 적립 {format(member.data.totals.earnedTotal)} P · 지원 사용 {format(member.data.totals.spentTotal)} P</p>
      <label className="block">수동 조정량 (지급은 양수, 차감은 음수)<input className={input} type="number" value={delta} disabled={!!revoke}
        onChange={e=>{setDelta(Number(e.target.value));setRequestId(null)}} /></label>
      <label className="block">회수할 적립 거래 UUID<input className={input} value={revoke} pattern="[0-9A-Fa-f-]{36}"
        onChange={e=>{setRevoke(e.target.value);setRequestId(null)}} /></label>
      <label className="block">변경 사유<input className={input} value={reason} maxLength={500} required
        onChange={e=>{setReason(e.target.value);setRequestId(null)}} /></label>
      <button className={button} disabled={adjust.isPending || (!revoke && !delta)}>포인트 조정 기록</button>
      {adjust.isSuccess ? <p role="status">원장에 조정 내역을 기록했습니다.</p> : null}
      {adjust.isError ? <p role="alert" className="text-red-700">조정 실패. 잔액과 거래를 확인해 주세요.</p> : null}
    </form> : null}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr>{['시각','회원','변동','잔액','종류 / 사유','관리자','거래'].map(x=><th key={x} className="p-2">{x}</th>)}</tr></thead>
        <tbody>{entries.data?.map(e => <tr className="border-t" key={e.id}>
          <td className="p-2">{new Date(e.createdAt).toLocaleString('ko-KR')}</td><td className="p-2">{e.userId}</td>
          <td className="p-2">{format(e.amount)}</td><td className="p-2">{format(e.balanceAfter)}</td>
          <td className="p-2">{e.kind} / {e.reason}</td><td className="p-2">{e.actorId ?? '—'}</td>
          <td className="p-2">{e.id}{selected&&e.kind==='EARN'?<button type="button" className={plain} onClick={()=>{setRevoke(e.id);setRequestId(null)}}>회수 대상으로 선택</button>:null}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {entries.isSuccess && !entries.data.length ? <p>거래 내역이 없습니다.</p> : null}
    <Pagination page={pages} setPage={setPages} size={entries.data?.length ?? 0} />
  </section>
}

function Pagination({page,setPage,size}:{page:number;setPage:(n:number)=>void;size:number}) {
  return <nav className="flex items-center gap-2"><button type="button" className={plain} disabled={page===0} onClick={()=>setPage(page-1)}>이전</button>
    <span>{page+1}</span><button type="button" className={plain} disabled={size<50} onClick={()=>setPage(page+1)}>다음</button></nav>
}
function StatsTable({rows}:{rows:Record<string,Cell>[]}) {
  if (!rows.length) return <p className="text-sm">집계 자료가 없습니다.</p>
  const keys=Object.keys(rows[0])
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm">
    <thead><tr>{keys.map(k=><th key={k} className="p-2">{statLabels[k]??k}</th>)}</tr></thead>
    <tbody>{rows.map((row,i)=><tr key={i} className="border-t">{keys.map(k=><td key={k} className="p-2">{k==='activity' ? activityLabels[row[k] as PointActivity] : typeof row[k]==='number' ? format(row[k] as number) : row[k]}</td>)}</tr>)}</tbody>
  </table></div>
}
