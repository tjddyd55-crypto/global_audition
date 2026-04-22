/**
 * UI 스펙 고정 클래스 (캡처/문서와 동일). Tailwind만 사용.
 */

export const PAGE_CONTAINER = 'max-w-[1200px] mx-auto px-6 max-md:px-4'

export const SECTION_GAP = 'flex flex-col gap-6'

export const CARD_BASE = 'bg-white border border-[#E5E7EB] rounded-xl p-4'

/** 썸네일 상단 풀블리드용 (본문은 내부에서 p-4) */
export const CARD_MEDIA_SHELL = 'bg-white border border-[#E5E7EB] rounded-xl overflow-hidden'

export const TITLE_PAGE = 'text-lg font-semibold text-gray-900'

export const TEXT_SUB = 'text-sm text-gray-600'

export const BTN_PRIMARY =
  'shrink-0 bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full md:w-auto inline-flex items-center justify-center font-medium disabled:cursor-not-allowed disabled:opacity-50'

export const BTN_SECONDARY =
  'shrink-0 border border-[#E5E7EB] bg-white text-gray-900 px-4 py-2 rounded-lg w-full md:w-auto inline-flex items-center justify-center font-medium text-sm disabled:cursor-not-allowed disabled:opacity-50'

export const DROPDOWN_ITEM = 'block w-full py-2 px-3 text-left text-sm text-gray-900 hover:bg-gray-100 no-underline'

export const INPUT_BASE = 'w-full rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm'
