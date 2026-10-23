'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

/** 에러 발생 시 전체 크래시 대신 fallback UI 표시. 사용자에는 에러 상세 노출 안 함. */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <DefaultErrorFallback onRetry={() => this.setState({ hasError: false })} />
        )
      )
    }
    return this.props.children
  }
}

function DefaultErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('common')
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-lg font-semibold text-gray-900">{t('errorTemp')}</p>
        <p className="mb-6 text-sm text-gray-600">{t('errorRetryHint')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  )
}
