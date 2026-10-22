'use client'

import Link from 'next/link'
import { CountryAdminAuthGate } from '@/components/admin/CountryAdminAuthGate'

const MENU = [
  { name: '국가 현황', path: '/admin/country' },
  { name: '직원·CRM', path: '/admin/country?tab=crm' },
  { name: '기획사 검토', path: '/admin/country?tab=review' },
  { name: '실적', path: '/admin/country?tab=performance' },
  { name: '예상 정산', path: '/admin/country?tab=settlement' },
]

export default function CountryAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CountryAdminAuthGate>
      <div className="flex h-screen flex-col bg-gray-50">
        <header className="border-b bg-white px-4 py-2.5 text-sm text-gray-600">국가 운영</header>
        <div className="flex min-h-0 flex-1">
          <aside className="w-56 shrink-0 border-r bg-white p-4">
            <nav className="space-y-2">
              {MENU.map((item) => (
                <Link key={item.path} href={item.path} className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </CountryAdminAuthGate>
  )
}
