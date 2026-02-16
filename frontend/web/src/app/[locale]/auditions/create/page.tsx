'use client'

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from '../../../../i18n.config'
import { auditionApi } from '../../../../lib/api/auditions'
import { authApi } from '../../../../lib/api/auth'
import { useTranslations } from 'next-intl'

export default function CreateAuditionPage() {
  const router = useRouter()
  const t = useTranslations('common')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [userType, setUserType] = useState<'APPLICANT' | 'BUSINESS' | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'OPEN' | 'CLOSED'>('DRAFT')
  const [countryCode, setCountryCode] = useState('')
  const [category, setCategory] = useState('')
  const [deadlineAt, setDeadlineAt] = useState('')

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      router.push('/login')
      setIsCheckingAuth(false)
      return
    }
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    // AGENCY or ADMIN can create auditions (treated as BUSINESS)
    if (role !== 'AGENCY' && role !== 'ADMIN') {
      setError('기획사만 오디션 공고를 작성할 수 있습니다')
      setTimeout(() => router.push('/'), 2000)
    } else {
      setUserType('BUSINESS')
    }
    setIsCheckingAuth(false)
  }, [router])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해주세요')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      await auditionApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        countryCode: countryCode.trim() || undefined,
        category: category.trim() || undefined,
        deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : undefined,
      })
      router.push('/my/auditions')
    } catch (err: any) {
      console.error('Create audition failed:', err)
      setError(err.response?.data?.message || '오디션 공고 작성에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (userType !== 'BUSINESS') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">
          {error || '기획사만 오디션 공고를 작성할 수 있습니다'}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">오디션 공고 작성</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="오디션 제목"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="오디션에 대한 상세한 설명을 입력해주세요"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">상태</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg">
                <option value="DRAFT">DRAFT</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">국가 코드(선택)</label>
              <input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">카테고리(선택)</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">마감일시(선택)</label>
            <input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? '작성 중...' : '공고 등록'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
