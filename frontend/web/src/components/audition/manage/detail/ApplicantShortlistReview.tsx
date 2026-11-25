'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApplicantStar, useApplicantShortlist } from '../useApplicantShortlist'

export function ApplicantShortlistReview({ auditionId, applicationId, round }: { auditionId: string; applicationId: string; round: number }) {
  const shortlist = useApplicantShortlist(auditionId, round)
  const saved = shortlist.entries.find(x => x.applicationId === applicationId)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { setMemo(saved?.memo ?? '') }, [applicationId, round, saved?.memo])
  return <section className="rounded-xl border border-yellow-200 bg-yellow-50/40 p-3" aria-label="내부 검토">
    <div className="flex items-center gap-3"><ApplicantStar saved={!!saved} disabled={shortlist.pending || shortlist.error} onClick={() => shortlist.change([applicationId], !saved)} />
      <div><p className="font-semibold">{round ? `${round}차 관심 지원자` : '전체 접수 관심 지원자'}</p><p className="text-xs text-gray-600">기획사 내부 공용 · 지원자에게 공개되지 않습니다.</p></div></div>
    {saved ? <div className="mt-3 flex flex-col gap-2">
      {saved.savedAt ? <p className="break-all text-xs text-gray-500">등록: {new Date(saved.savedAt).toLocaleString('ko-KR')} · 담당자 {saved.savedBy}</p> : null}
      <label className="text-sm">내부 검토 메모<textarea aria-label="내부 검토 메모" maxLength={1000} value={memo} onChange={e => setMemo(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2" /></label>
      <button type="button" disabled={saving || shortlist.pending} className="self-end rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-50" onClick={async () => { setSaving(true); try { await shortlist.saveMemo(applicationId, memo); toast.success('내부 메모를 저장했습니다.') } catch { toast.error('메모 저장에 실패했습니다. 다시 시도해 주세요.') } finally { setSaving(false) } }}>메모 저장</button>
    </div> : null}
    {shortlist.error ? <p role="alert" className="mt-2 text-sm text-red-600">관심 목록을 불러오지 못했습니다.</p> : null}
  </section>
}
