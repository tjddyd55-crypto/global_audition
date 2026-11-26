'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SuperAdminAuthGate } from '@/components/admin/SuperAdminAuthGate'

const BASE = '/admin/super'
const MENU = [
  {
    id: 'general', name: '일반 설정', icon: 'M4 7h16M4 12h16M4 17h16M8 5v4m8 1v4m-6 1v4',
    items: [
      { name: '오디션 태그', path: 'tags' },
      { name: '번역 공급자', path: 'translation-settings' },
    ],
  },
  {
    id: 'members', name: '회원 관리', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2',
    items: [
      { name: '회원 관리', path: 'users' },
      { name: '미성년자 정책·동의', path: 'minor-policy' },
      { name: '복구 요청', path: 'recovery' },
    ],
  },
  {
    id: 'auditions', name: '오디션·채널 관리', icon: 'M3 5h18v14H3zM10 8l6 4-6 4z',
    items: [
      { name: '글로벌 기획사', path: 'agencies' },
      { name: '채널·캐스팅 운영', path: 'casting' },
    ],
  },
  {
    id: 'credits', name: '크레딧·포인트 관리', icon: 'M3 6h17v14H3zM20 10h2v6h-6v-6zM3 6l14-3v3',
    items: [
      { name: '크레딧 정책', path: 'credit-policies' },
      { name: '크레딧 패키지', path: 'credit-packages' },
      { name: '포인트 관리', path: 'points' },
      { name: '오디션 지원비', path: 'application-fee' },
      { name: '대량 지급', path: 'bulk-grant' },
      { name: '크레딧 거래 내역', path: 'transactions' },
    ],
  },
  {
    id: 'payments', name: '결제 관리', icon: 'M2 5h20v14H2zM2 10h20M6 15h4',
    items: [
      { name: '결제 설정', path: 'payments/settings' },
      { name: '결제 공급자', path: 'payments/providers' },
      { name: '결제 주문', path: 'payment-orders' },
      { name: '결제 거래', path: 'payments/transactions' },
      { name: '환불 관리', path: 'payments/refunds' },
      { name: '웹훅', path: 'payments/webhooks' },
      { name: '결제 오류', path: 'payments/errors' },
      { name: '결제 테스트', path: 'payments/test' },
    ],
  },
  {
    id: 'countries', name: '국가·지사 관리', icon: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2a16 16 0 0 0 0 20m0-20a16 16 0 0 1 0 20',
    items: [
      { name: '국가 조직', path: 'countries' },
      { name: '계약 관리', path: 'contracts' },
      { name: '국가 실적', path: 'country-ops' },
    ],
  },
  {
    id: 'revenue', name: '매출·정산 관리', icon: 'M3 3v18h18M8 17v-5m5 5V8m5 9V5',
    items: [
      { name: '매출 통계', path: 'revenue' },
      { name: '월 정산', path: 'settlements' },
    ],
  },
  {
    id: 'system', name: '시스템 관리', icon: 'M12 22S4 18 4 10V5l8-3 8 3v5c0 8-8 12-8 12ZM9 12l2 2 4-4',
    items: [
      { name: '로그', path: 'logs' },
    ],
  },
] as const

function MenuIcon({ path }: { path: string }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={path} />
    </svg>
  )
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [mobileOpen, setMobileOpen] = useState(false)
  const activePath = (path: string) => pathname === path || pathname.startsWith(path + '/')
  const activeGroup = MENU.find(group => group.items.some(item => activePath(BASE + '/' + item.path)))
  const activeItem = activeGroup?.items.find(item => activePath(BASE + '/' + item.path))
  const activeGroupId = activeGroup?.id

  useEffect(() => {
    if (activeGroupId) setExpanded(previous => ({ ...previous, [activeGroupId]: true }))
    setMobileOpen(false)
  }, [pathname, activeGroupId])

  return (
    <SuperAdminAuthGate>
      <div className="flex h-dvh flex-col overflow-hidden bg-gray-50">
        <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-2.5">
          <Link href="/" className="text-sm text-gray-600 hover:text-violet-700">← 메인으로</Link>
          <span className="font-semibold text-gray-900">본사 관리자</span>
          <button type="button" aria-expanded={mobileOpen} aria-controls="super-sidebar" onClick={() => setMobileOpen(open => !open)} className="ml-auto rounded-md border px-3 py-1.5 text-sm font-medium md:hidden">
            관리자 메뉴
          </button>
        </header>
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {mobileOpen && <button type="button" aria-label="관리자 메뉴 닫기" onClick={() => setMobileOpen(false)} className="absolute inset-0 z-10 bg-black/30 md:hidden" />}
          <aside id="super-sidebar" className={(mobileOpen ? 'absolute inset-y-0 left-0 z-20 block ' : 'hidden ') + 'w-64 max-w-[85vw] shrink-0 overflow-y-auto overscroll-contain border-r border-gray-200 bg-white p-3 md:static md:block'}>
            <nav aria-label="슈퍼 관리자 메뉴" className="space-y-2">
              <Link href={BASE} onClick={() => setMobileOpen(false)} aria-current={pathname === BASE ? 'page' : undefined} className={'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold ' + (pathname === BASE ? 'bg-blue-600 text-white' : 'text-gray-800 hover:bg-gray-100')}>
                <MenuIcon path="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
                대시보드
              </Link>
              {MENU.map(group => {
                const open = expanded[group.id] ?? activeGroupId === group.id
                const panelId = 'super-menu-' + group.id
                return (
                  <div key={group.id}>
                    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setExpanded(previous => ({ ...previous, [group.id]: !open }))} className={'flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-semibold hover:bg-gray-100 ' + (activeGroupId === group.id ? 'text-blue-700' : 'text-gray-800')}>
                      <MenuIcon path={group.icon} />
                      <span className="flex-1">{group.name}</span>
                      <span aria-hidden="true" className={open ? 'rotate-180' : ''}>⌄</span>
                    </button>
                    <ul id={panelId} hidden={!open} className="ml-5 space-y-1 border-l border-gray-200 pl-2">
                      {group.items.map(item => {
                        const href = BASE + '/' + item.path
                        const active = activePath(href)
                        return (
                          <li key={href}>
                            <Link href={href} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined} className={'block rounded-md px-3 py-2 text-sm ' + (active ? 'bg-blue-600 font-medium text-white' : 'text-gray-700 hover:bg-gray-100')}>
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3 md:p-6">
            <nav aria-label="현재 위치" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {activeGroup && <><span>{activeGroup.name}</span><span aria-hidden="true">›</span></>}
              <span aria-current="page" className="font-medium text-gray-900">{activeItem?.name ?? '대시보드'}</span>
            </nav>
            {children}
          </main>
        </div>
      </div>
    </SuperAdminAuthGate>
  )
}
