/**
 * 모바일 공통 레이아웃 토큰 (Tailwind 클래스). 모바일 페이지는 개별 margin/padding 대신 이 값을 쓴다.
 * - 좌우 여백 16px / 섹션 간격 20px / 카드 간격 12px / 카드 내부 12px / 컨트롤 높이 40px
 */
export const M_PAGE_X = 'px-4'
export const M_SECTION_TOP = 'pt-5'
export const M_CARD_GAP = 'gap-3'
export const M_CARD_PAD = 'p-3'
export const M_CARD = 'rounded-xl border border-neutral-200 bg-white shadow-sm'
export const M_SECTION_HEAD = 'mb-3 flex min-h-8 items-center justify-between gap-2'
export const M_SECTION_TITLE = 'min-w-0 break-words text-lg font-bold leading-tight text-neutral-900'
/** 가로 스크롤 필터 줄 (페이지 자체는 가로 스크롤 없음) */
export const M_FILTER_ROW =
  'flex min-w-0 gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
export const M_CHIP_BASE =
  'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold'
export const M_CHIP_ON = 'bg-violet-600 text-white'
export const M_CHIP_OFF = 'border border-neutral-300 bg-white text-neutral-800'
export const M_SELECT =
  'h-9 shrink-0 appearance-none whitespace-nowrap rounded-full border border-neutral-300 bg-white bg-[length:12px] bg-[right_10px_center] bg-no-repeat pl-3.5 pr-7 text-sm font-semibold text-neutral-800'
export const M_SELECT_ARROW = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23525252' stroke-width='1.6'/%3E%3C/svg%3E\")",
} as const
