import type { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getDeviceFromHeaders } from './resolveDevice'

/**
 * PC 전용 화면 래퍼 (서버 컴포넌트).
 *
 * 현재 요청의 device가 mobile이면 `fallback`을 렌더하고, 그 외에는 `children`을 렌더한다.
 * `fallback`을 생략하면 기본 `<RequiresDesktopNotice />`를 보여준다.
 *
 * 사용처:
 * - 관리자 콘솔(`/admin/super/*`): 라우트 layout에서 래핑하면 모든 하위가 모바일 접근 시 안내로 대체
 * - 에이전시 관리 페이지(`/my/auditions/[id]/manage` 등): 페이지 단위로 래핑
 */
export function PcOnly({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const device = getDeviceFromHeaders()
  if (device === 'mobile') return <>{fallback ?? <RequiresDesktopNotice />}</>
  return <>{children}</>
}

/**
 * 모바일에서 PC 전용 기능에 진입한 경우의 공통 안내.
 * 쿠키 토글로 강제 PC 뷰 전환을 유도하는 링크도 함께 제공한다.
 */
export async function RequiresDesktopNotice() {
  const tDevice = await getTranslations('device')
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">{tDevice('requireTitle')}</h1>
      <p className="max-w-md text-sm text-neutral-600">{tDevice('requireBody')}</p>
      <div className="flex flex-col gap-2 text-sm">
        <Link
          href="/"
          prefetch={false}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white no-underline"
        >
          {tDevice('backHome')}
        </Link>
        <ForcePcViewLink label={tDevice('forcePcHint')} />
      </div>
    </div>
  )
}

/**
 * 쿠키를 PC로 강제 토글할 수 있는 링크 (클라이언트 핸들러 부착용).
 * 서버 컴포넌트에서도 직접 렌더할 수 있도록 링크 형태를 유지하되,
 * 별도 클라이언트 버튼이 필요하면 호출처에서 `setDevicePref('pc')`를 사용한다.
 */
function ForcePcViewLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="text-xs text-neutral-500 underline-offset-2 hover:underline"
      data-testid="force-pc-view-hint"
      // data-* 훅만 제공. 실제 토글 로직은 app-level 토글 컴포넌트에서 setDevicePref 호출.
    >
      {label}
    </a>
  )
}
