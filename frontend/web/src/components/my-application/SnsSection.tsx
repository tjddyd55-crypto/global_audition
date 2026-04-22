import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

const SNS_PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X',
  facebook: 'Facebook',
  other: '기타',
}

export type SnsLinkRow = { platform: string; url: string }

export type SnsSectionProps = {
  snsLinks: SnsLinkRow[]
}

export function SnsSection({ snsLinks }: SnsSectionProps) {
  const items = snsLinks.filter((l) => l.url?.trim() && l.platform?.trim())

  return (
    <section className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-4`}>SNS</h2>
      {items.length === 0 ? (
        <p className={`${TEXT_SUB}`}>등록된 SNS 없음</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((row, idx) => {
            const key = `${row.platform}-${idx}`
            const label =
              SNS_PLATFORM_LABEL[row.platform.trim().toLowerCase()] ?? row.platform.trim()
            return (
              <li key={key} className="flex flex-col gap-0.5 rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="shrink-0 text-sm font-medium text-neutral-800">{label}</span>
                <a
                  href={row.url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 break-all text-sm text-[#3B82F6] underline-offset-2 hover:underline"
                >
                  {row.url.trim()}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
