'use client'

import { Link } from '../../i18n.config'
import { useTranslations } from 'next-intl'

export interface NotDevelopedPageProps {
  /** 페이지/기능 이름 (선택). 예: "채널 목록", "영상 피드" */
  featureName?: string
}

/**
 * 개발되지 않은 페이지 또는 기능용 플레이스홀더.
 * 참고: Global Audition App (참고용) UI 구현 시, 해당 기능이 아직 백엔드/프론트에 없으면 이 컴포넌트를 사용합니다.
 */
export default function NotDevelopedPage({ featureName }: NotDevelopedPageProps) {
  const t = useTranslations('common')

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          {featureName ? `「${featureName}」` : ''} 개발되지 않은 페이지 또는 기능입니다
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          이 페이지 또는 기능은 아직 개발 또는 페이지 생성이 되지 않았습니다.
          <br />
          차후 구현 예정입니다.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            {t('home') ?? '홈으로'}
          </Link>
        </div>
      </div>
    </div>
  )
}
