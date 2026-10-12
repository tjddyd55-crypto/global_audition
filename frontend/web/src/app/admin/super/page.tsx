import Link from 'next/link'

export default function SuperAdminHome() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">슈퍼 관리자 대시보드</h1>
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-600">좌측 메뉴에서 관리 기능을 선택하세요.</p>
        <p className="mt-4 text-sm text-gray-500">
          바로가기:{' '}
          <Link href="/admin/super/recovery" className="font-medium text-[#3B82F6] underline">
            복구 요청
          </Link>
          {' · '}
          <Link href="/admin/super/credit-policies" className="font-medium text-[#3B82F6] underline">
            크레딧 정책
          </Link>
        </p>
        <p className="mt-3 text-sm text-gray-500">
          오디션·지원·라운드·투표 운영은 기획사 웹(
          <Link href="/my/auditions" className="underline">
            /my/auditions
          </Link>
          )과 동일 API를 사용합니다. 슈퍼관리자는 비공개 공고 조회가 허용됩니다.
        </p>
      </div>
    </div>
  )
}
