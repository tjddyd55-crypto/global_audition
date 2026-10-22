/** 실제 사진 위에는 흰 글자, 포스터가 없으면 보라 브랜드 위의 어두운 글자. */
export function heroContrast(showingPhoto: boolean) {
  if (showingPhoto) {
    return {
      overlay:
        'absolute bottom-0 left-0 right-0 z-[1] bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-20 text-white',
      title: 'mb-1 text-balance text-xl font-bold leading-snug text-white md:text-2xl',
      subtitle: 'mt-1 text-sm text-white/70',
      tag: 'rounded-full border border-white/35 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white',
      deadline: 'm-0 text-sm text-white/80',
      urgent: 'text-sm font-semibold text-red-300',
      action:
        'inline-flex items-center border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white md:text-sm',
      link:
        'inline-flex items-center border border-white/40 px-4 py-2 text-xs font-semibold text-white no-underline md:text-sm',
      emptyLabel: 'text-sm font-medium text-white/90',
    }
  }
  return {
    overlay:
      'absolute bottom-0 left-0 right-0 z-[1] bg-gradient-to-t from-white via-white/90 to-transparent p-4 pt-20 text-neutral-950',
    title: 'mb-1 text-balance text-xl font-bold leading-snug text-neutral-950 md:text-2xl',
    subtitle: 'mt-1 text-sm text-neutral-700',
    tag: 'rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800',
    deadline: 'm-0 text-sm text-neutral-800',
    urgent: 'text-sm font-semibold text-red-700',
    action:
      'inline-flex items-center border border-violet-300 bg-white px-4 py-2 text-xs font-semibold text-violet-800 md:text-sm',
    link:
      'inline-flex items-center border border-violet-300 bg-white px-4 py-2 text-xs font-semibold text-violet-800 no-underline md:text-sm',
    emptyLabel: 'text-sm font-medium text-violet-800',
  }
}
