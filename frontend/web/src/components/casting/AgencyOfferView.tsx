'use client'

import type { CastingOffer } from '@/shared/casting/model'
import { daysLeft, isOpenOffer } from '@/shared/casting/model'
import { koCompensation, koCountry, koField, koProject, koStatus } from './agencyKo'

/** 기획사 화면용(한국어) 제안 본문. 미리보기와 상세가 같은 모양을 쓴다. */
export function AgencyOfferView({ offer, talentName }: { offer: CastingOffer; talentName?: string | null }) {
  const left = daysLeft(offer.expiresAt)
  const rows: [string, string][] = [
    ['받는 사람', talentName ?? offer.talent?.name ?? '—'],
    ['프로젝트 유형', koProject(offer.projectType)],
    ['분야', koField(offer.roleField)],
    ['활동 지역', [koCountry(offer.workCountry), offer.workLocation ?? ''].filter(Boolean).join(' · ')],
    ['일정', offer.scheduleText ?? ''],
    ['보수', [koCompensation(offer.compensationType), offer.compensationNote ?? ''].filter(Boolean).join(' · ')],
    [
      '응답 기한',
      offer.expiresAt
        ? `${new Date(offer.expiresAt).toLocaleDateString('ko-KR')}${isOpenOffer(offer) && left !== null ? ` · ${left}일 남음` : ''}`
        : '',
    ],
    ['연락처 공유 요청', offer.contactRequested ? '요청함(지원자가 수락 시 동의하면 이메일 공유)' : '요청 안 함'],
  ]
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {offer.id ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold">{koStatus(offer.status)}</span> : null}
        <h2 className="min-w-0 break-words text-lg font-semibold">{offer.title || '(제목 없음)'}</h2>
      </div>
      <dl className="grid grid-cols-[minmax(6.5rem,auto)_1fr] gap-x-3 gap-y-1.5 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-neutral-500">{k}</dt>
              <dd className="min-w-0 break-words">{v}</dd>
            </div>
          ))}
      </dl>
      <p className="whitespace-pre-wrap break-words rounded-lg bg-neutral-50 p-3 text-sm">{offer.message || '(메시지 없음)'}</p>
      <p className="text-xs text-neutral-500">
        지원자 화면에서는 지원자 언어로 자동 번역본이 함께 보입니다(원문 보기 가능). 연락처·내부 메모는 번역에 보내지 않습니다.
      </p>
    </div>
  )
}
