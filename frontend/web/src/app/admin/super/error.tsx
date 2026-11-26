'use client'

export default function SuperAdminContentError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="rounded-lg border border-red-200 bg-white p-5">
      <h1 className="font-semibold text-gray-900">화면을 불러오지 못했습니다.</h1>
      <button type="button" onClick={reset} className="mt-3 rounded-md border px-3 py-2 text-sm">
        다시 시도
      </button>
    </section>
  )
}
