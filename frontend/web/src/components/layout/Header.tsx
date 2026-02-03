'use client'

import { Link, useRouter } from '../../i18n.config'
import { useTranslations } from 'next-intl'
import { useState, memo, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import LanguageSwitcher from '../common/LanguageSwitcher'
import { authApi } from '../../lib/api/auth'
import { userApi } from '../../lib/api/user'

const Header = memo(function Header() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const t = useTranslations('common')
  
  // 인증 상태 확인 (useState로 관리하여 리렌더링 트리거)
  const [token, setToken] = useState<string | null>(null)
  
  // 클라이언트에서만 토큰 확인 및 변경 감지
  useEffect(() => {
    const checkToken = () => {
      const currentToken = authApi.getToken()
      setToken((prevToken) => {
        if (prevToken !== currentToken) {
          // 토큰이 변경된 경우 쿼리 캐시 업데이트
          if (!currentToken) {
            // 토큰이 삭제된 경우 (로그아웃) 쿼리 캐시 정리
            queryClient.removeQueries({ queryKey: ['currentUser'] })
          } else {
            // 토큰이 추가된 경우 (로그인) 쿼리 무효화하여 재조회
            queryClient.invalidateQueries({ queryKey: ['currentUser'] })
          }
        }
        return currentToken
      })
    }
    
    // 초기 토큰 확인
    checkToken()
    
    // localStorage 변경 감지를 위한 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'auth_token') {
        checkToken()
      }
    }
    
    // 커스텀 이벤트 리스너 (같은 탭에서 로그인/로그아웃 시)
    const handleAuthChange = () => {
      checkToken()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleAuthChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [queryClient])
  
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => userApi.getCurrentUser(),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // 메뉴 토글 핸들러 메모이제이션
  const toggleMenu = useMemo(() => () => setIsMenuOpen(prev => !prev), [])
  const closeMenu = useMemo(() => () => setIsMenuOpen(false), [])
  const toggleUserMenu = useMemo(() => () => setIsUserMenuOpen(prev => !prev), [])

  const handleLogout = () => {
    authApi.logout()
    queryClient.removeQueries({ queryKey: ['currentUser'] })
    setToken(null)
    setIsUserMenuOpen(false)
    // 로그아웃 후 홈으로 이동하고 페이지 새로고침
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            {t('appName')}
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/auditions" className="hover:text-primary-600">
              {t('auditions')}
            </Link>
            <Link href="/channel" className="hover:text-primary-600">
              채널
            </Link>
            
            {!isUserLoading && token && user ? (
              // 로그인 상태
              <div className="relative flex items-center space-x-4">
                {user.userType === 'BUSINESS' && (
                  <Link href="/my/dashboard" className="hover:text-primary-600 font-medium">
                    대시보드
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                        <div className="py-1">
                          <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <p className="text-xs text-primary-600 mt-1">
                              {user.userType === 'BUSINESS' ? '기획사' : '지원자'}
                            </p>
                          </div>
                          {user.userType === 'BUSINESS' ? (
                            <>
                              <Link
                                href="/my/dashboard"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                대시보드
                              </Link>
                              <Link
                                href="/my/auditions"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                내 오디션
                              </Link>
                              <Link
                                href="/my/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                내 정보
                              </Link>
                              <Link
                                href="/auditions/create"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                오디션 등록
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                프로필
                              </Link>
                              <Link
                                href="/channel"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-2 hover:bg-gray-100 text-sm"
                              >
                                내 채널
                              </Link>
                            </>
                          )}
                          <div className="border-t mt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                            >
                              로그아웃
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // 로그아웃 상태
              <>
                <Link href="/register" className="hover:text-primary-600">
                  {t('register')}
                </Link>
                <Link href="/login" className="hover:text-primary-600">
                  {t('login')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="메뉴"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            <Link
              href="/auditions"
              className="block py-2 hover:text-primary-600"
              onClick={closeMenu}
            >
              {t('auditions')}
            </Link>
            <Link
              href="/channel"
              className="block py-2 hover:text-primary-600"
              onClick={closeMenu}
            >
              채널
            </Link>
            
            {!isUserLoading && token && user ? (
              // 로그인 상태 (모바일)
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="px-2 py-2 mb-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-primary-600 mt-1">
                      {user.userType === 'BUSINESS' ? '기획사' : '지원자'}
                    </p>
                  </div>
                  {user.userType === 'BUSINESS' ? (
                    <>
                      <Link
                        href="/my/dashboard"
                        className="block py-2 hover:text-primary-600"
                        onClick={closeMenu}
                      >
                        대시보드
                      </Link>
                      <Link
                        href="/my/auditions"
                        className="block py-2 hover:text-primary-600"
                        onClick={closeMenu}
                      >
                        내 오디션
                      </Link>
                      <Link
                        href="/my/profile"
                        className="block py-2 hover:text-primary-600"
                        onClick={closeMenu}
                      >
                        내 정보
                      </Link>
                      <Link
                        href="/auditions/create"
                        className="block py-2 hover:text-primary-600"
                        onClick={closeMenu}
                      >
                        오디션 등록
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/profile"
                        className="block py-2 hover:text-primary-600"
                        onClick={closeMenu}
                      >
                        프로필
                      </Link>
                      <Link
                        href="/channel"
                        className="block py-2 hover:text-primary-600"
                        onClick={closeMenu}
                      >
                        내 채널
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      closeMenu()
                    }}
                    className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              // 로그아웃 상태 (모바일)
              <>
                <Link
                  href="/register"
                  className="block py-2 hover:text-primary-600"
                  onClick={closeMenu}
                >
                  {t('register')}
                </Link>
                <Link
                  href="/login"
                  className="block py-2 hover:text-primary-600"
                  onClick={closeMenu}
                >
                  {t('login')}
                </Link>
              </>
            )}
            <div className="pt-2 border-t">
              <LanguageSwitcher />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
})

export default Header
