import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export type IntroSectionProps = {
  introText: string | null | undefined
}

export function IntroSection({ introText }: IntroSectionProps) {
  const text = introText?.trim() ?? ''

  return (
    <section className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-4`}>자기소개 · 지원 동기</h2>
      {text ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{introText}</p>
      ) : (
        <p className={TEXT_SUB}>작성된 내용이 없습니다.</p>
      )}
    </section>
  )
}
