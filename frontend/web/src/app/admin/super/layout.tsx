'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SuperAdminAuthGate } from '@/components/admin/SuperAdminAuthGate'

const MENU = [
  { name: '크레딧 정책', path: '/admin/super/credit-policies' },
  { name: '크레딧 패키지', path: '/admin/super/credit-packages' },
  { name: '유저 관리', path: '/admin/super/users' },
  { name: '거래 내역', path: '/admin/super/transactions' },
  { name: '로그', path: '/admin/super/logs' },
  { name: '대량 지급', path: '/admin/super/bulk-grant' },
] as const

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SuperAdminAuthGate>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-4">
          <h2 className="mb-6 text-lg font-semibold">슈퍼 관리자</h2>
          <nav className="space-y-2">
            {MENU.map((item) => {
              const isActive = pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    isActive ? 'bg-[#3B82F6] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </SuperAdminAuthGate>
  )
}
