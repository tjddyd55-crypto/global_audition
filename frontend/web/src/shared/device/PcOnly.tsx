import type { ReactNode } from 'react'
import Link from 'next/link'
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
export function RequiresDesktopNotice() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">PC에서 이용해주세요</h1>
      <p className="max-w-md text-sm text-neutral-600">
        이 화면은 관리·운영용 인터페이스로, 모바일에서는 모든 기능을 원활하게 사용하기 어렵습니다.
        데스크톱 브라우저에서 다시 접속해 주세요.
      </p>
      <div className="flex flex-col gap-2 text-sm">
        <Link
          href="/"
          prefetch={false}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white no-underline"
        >
          홈으로 돌아가기
        </Link>
        <ForcePcViewLink />
      </div>
    </div>
  )
}

/**
 * 쿠키를 PC로 강제 토글할 수 있는 링크 (클라이언트 핸들러 부착용).
 * 서버 컴포넌트에서도 직접 렌더할 수 있도록 링크 형태를 유지하되,
 * 별도 클라이언트 버튼이 필요하면 호출처에서 `setDevicePref('pc')`를 사용한다.
 */
function ForcePcViewLink() {
  return (
    <a
      href="#"
      className="text-xs text-neutral-500 underline-offset-2 hover:underline"
      data-testid="force-pc-view-hint"
      // data-* 훅만 제공. 실제 토글 로직은 app-level 토글 컴포넌트에서 setDevicePref 호출.
    >
      그래도 PC 레이아웃으로 보려면 헤더의 뷰 전환을 사용하세요
    </a>
  )
}
