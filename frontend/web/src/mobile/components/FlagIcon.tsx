/** 모집 국가 국기 (이모지 대신 인라인 SVG — 기기별 렌더링 차이 없음). OTHER 는 지구본. */
type Code = 'KR' | 'MN' | 'JP' | 'OTHER'

export default function FlagIcon({ code, className = 'h-7 w-10' }: { code: Code; className?: string }) {
  if (code === 'OTHER') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M2.5 12h19M12 2.5c2.6 2.6 3.9 5.8 3.9 9.5s-1.3 6.9-3.9 9.5c-2.6-2.6-3.9-5.8-3.9-9.5S9.4 5.1 12 2.5z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 36 24" className={`${className} rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]`} aria-hidden>
      {code === 'JP' ? (
        <>
          <rect width="36" height="24" fill="#fff" />
          <circle cx="18" cy="12" r="7.2" fill="#BC002D" />
        </>
      ) : code === 'MN' ? (
        <>
          <rect width="36" height="24" fill="#C4272F" />
          <rect x="12" width="12" height="24" fill="#015197" />
          <g fill="#F9CF02">
            <circle cx="6" cy="6.2" r="1.3" />
            <circle cx="6" cy="9.6" r="1.8" />
            <rect x="3.4" y="12.2" width="5.2" height="0.9" />
            <rect x="3.4" y="18.6" width="5.2" height="0.9" />
            <rect x="4.5" y="14" width="3" height="3.6" rx="1.5" />
            <rect x="2.4" y="12.2" width="0.9" height="7.3" />
            <rect x="8.7" y="12.2" width="0.9" height="7.3" />
          </g>
        </>
      ) : (
        <>
          <rect width="36" height="24" fill="#fff" />
          <g transform="rotate(33.7 18 12)">
            <circle cx="18" cy="12" r="6" fill="#0047A0" />
            <path d="M12 12a6 6 0 0 1 12 0a3 3 0 0 1-6 0a3 3 0 0 0-6 0z" fill="#CD2E3A" />
          </g>
          <g fill="#000">
            {[
              [7, 5.2, 33.7],
              [29, 18.8, 33.7],
              [29, 5.2, -33.7],
              [7, 18.8, -33.7],
            ].map(([x, y, r], i) => (
              <g key={i} transform={`rotate(${r} ${x} ${y})`}>
                <rect x={x - 3} y={y - 2.2} width="6" height="1" />
                <rect x={x - 3} y={y - 0.5} width="6" height="1" />
                <rect x={x - 3} y={y + 1.2} width="6" height="1" />
              </g>
            ))}
          </g>
        </>
      )}
    </svg>
  )
}
