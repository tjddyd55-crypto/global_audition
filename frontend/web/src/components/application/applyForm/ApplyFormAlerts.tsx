'use client'

type ApplyFormAlertsProps = {
  profileAutofillNotice: boolean
  formError: string | null
}

export default function ApplyFormAlerts({ profileAutofillNotice, formError }: ApplyFormAlertsProps) {
  return (
    <>
      {profileAutofillNotice ? (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          프로필 정보 자동 입력됨 — 아래 값은 프로필에서 가져온 내용입니다. 필요하면 수정한 뒤 제출하세요.
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      ) : null}
    </>
  )
}
