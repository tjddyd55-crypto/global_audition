'use client'

import { useTranslations } from 'next-intl'

type ApplySubmitButtonProps = {
  blocked: boolean
  submitting: boolean
}

export default function ApplySubmitButton({ blocked, submitting }: ApplySubmitButtonProps) {
  const t = useTranslations('apply')
  return (
    <button
      type="submit"
      disabled={blocked}
      className="min-h-12 w-full whitespace-normal break-words rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-base font-semibold leading-tight text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting ? t('submitting') : t('submit')}
    </button>
  )
}
