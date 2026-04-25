'use client'

import { AUDITION_DETAIL, HERO } from '@/shared/design-tokens'
import { safeArr, safeStr } from '@/shared/utils/safe'

function SectionBlock({
  iconLabel,
  title,
  items,
}: {
  iconLabel: string
  title: string
  items: string[]
}) {
  const list = safeArr(items)
    .map((s) => safeStr(s))
    .filter((s) => s.length > 0)
  return (
    <div style={{ marginBottom: AUDITION_DETAIL.sectionGapPx }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: AUDITION_DETAIL.sectionHeaderRowGapPx,
          marginBottom: AUDITION_DETAIL.sectionTitleBelowRowPx,
        }}
      >
        <span
          style={{
            width: AUDITION_DETAIL.sectionIconBoxPx,
            height: AUDITION_DETAIL.sectionIconBoxPx,
            borderRadius: AUDITION_DETAIL.videoRadiusPx,
            background: HERO.gradientStart,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: AUDITION_DETAIL.metaMutedPx,
            fontWeight: 700,
            color: HERO.primaryGradientStart,
          }}
        >
          {iconLabel}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
            color: '#111',
          }}
        >
          {title}
        </h3>
      </div>
      {list.length > 0 ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: AUDITION_DETAIL.listIndentPx,
            color: AUDITION_DETAIL.bodyColor,
            fontSize: AUDITION_DETAIL.listItemFontPx,
            lineHeight: AUDITION_DETAIL.listItemLineHeight,
          }}
        >
          {list.map((line, i) => (
            <li key={`${title}-${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            color: AUDITION_DETAIL.metaMutedColor,
            fontSize: AUDITION_DETAIL.metaMutedPx,
            lineHeight: AUDITION_DETAIL.listItemLineHeight,
          }}
        >
          정보 없음
        </p>
      )}
    </div>
  )
}

type PcAuditionDetailInfoProps = {
  descriptionText: string
  recruitList: string[]
  qualifications: string[]
  schedules: string[]
}

export default function PcAuditionDetailInfo({
  descriptionText,
  recruitList,
  qualifications,
  schedules,
}: PcAuditionDetailInfoProps) {
  return (
    <div>
      {descriptionText.length > 0 ? (
        <section className="border-t border-neutral-200 py-6">
          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: AUDITION_DETAIL.sectionTitlePx,
              fontWeight: AUDITION_DETAIL.sectionTitleWeight,
            }}
          >
            상세 설명
          </h2>
          <p
            className="whitespace-pre-line"
            style={{
              margin: 0,
              color: AUDITION_DETAIL.bodyColor,
              fontSize: AUDITION_DETAIL.bodyFontPx,
              lineHeight: AUDITION_DETAIL.listItemLineHeight,
            }}
          >
            {descriptionText}
          </p>
          <div className="mt-6 text-sm text-gray-600">
            지원 방법: 영상 업로드 후 간단 정보 입력
          </div>
        </section>
      ) : null}
      <section className="border-t border-neutral-200 py-6">
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: AUDITION_DETAIL.sectionTitlePx,
            fontWeight: AUDITION_DETAIL.sectionTitleWeight,
          }}
        >
          상세 안내
        </h2>
        {descriptionText.length === 0 ? (
          <div className="mb-6 text-sm text-gray-600">
            지원 방법: 영상 업로드 후 간단 정보 입력
          </div>
        ) : null}
        <SectionBlock iconLabel="R" title="모집 분야" items={recruitList} />
        <SectionBlock iconLabel="Q" title="지원 자격" items={qualifications} />
        <SectionBlock iconLabel="S" title="일정" items={schedules} />
      </section>
    </div>
  )
}
