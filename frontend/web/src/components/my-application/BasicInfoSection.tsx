import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const NATIONALITY_LABEL: Record<string, string> = {
  KR: '대한민국',
  MN: '몽골',
  JP: '일본',
  OTHER: '기타',
}

function formatBirthDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return iso.trim()
  return `${m[1]}.${m[2]}.${m[3]}`
}

export type BasicInfoSectionProps = {
  name: string | null | undefined
  birthDate: string | null | undefined
  age: number | null | undefined
  nationality: string | null | undefined
}

export function BasicInfoSection({ name, birthDate, age, nationality }: BasicInfoSectionProps) {
  const nat =
    nationality?.trim() != null && nationality.trim() !== ''
      ? NATIONALITY_LABEL[nationality] ?? nationality
      : '—'

  return (
    <section className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-4`}>기본 정보</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className={TEXT_SUB}>이름</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{name?.trim() || '—'}</dd>
        </div>
        <div>
          <dt className={TEXT_SUB}>생년월일</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{formatBirthDate(birthDate ?? null)}</dd>
        </div>
        <div>
          <dt className={TEXT_SUB}>나이</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">
            {age != null && age >= 0 ? `${age}세` : '—'}
          </dd>
        </div>
        <div>
          <dt className={TEXT_SUB}>국적</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{nat}</dd>
        </div>
      </dl>
    </section>
  )
}
