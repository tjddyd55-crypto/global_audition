'use client'

type ApplySubmitButtonProps = {
  blocked: boolean
  submitting: boolean
}

export default function ApplySubmitButton({ blocked, submitting }: ApplySubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={blocked}
      className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base
        font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting ? '제출 중…' : '지원서 제출'}
    </button>
  )
}
