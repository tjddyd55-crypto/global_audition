'use client'

type ApplicantDetailIntroSectionProps = {
  introText?: string | null
}

export default function ApplicantDetailIntroSection({ introText }: ApplicantDetailIntroSectionProps) {
  const content = introText?.trim() ? introText : '작성 내용이 없습니다.'

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">지원 동기 · 자기소개</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{content}</p>
    </section>
  )
}
