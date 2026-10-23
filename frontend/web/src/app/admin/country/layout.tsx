'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CountryAdminAuthGate } from '@/components/admin/CountryAdminAuthGate'
import { label, useCountrySession } from './kit'

const ADMIN = [
  { key: 'dashboard', path: '/admin/country' },
  { key: 'agencyMenu', path: '/admin/country/agencies' },
  { key: 'crm', path: '/admin/country/crm' },
  { key: 'approvals', path: '/admin/country/approvals' },
  { key: 'auditions', path: '/admin/country/auditions' },
  { key: 'staff', path: '/admin/country/staff' },
  { key: 'stats', path: '/admin/country/stats' },
  { key: 'settlement', path: '/admin/country/settlement' },
  { key: 'myContract', path: '/admin/country/contract' },
  { key: 'settings', path: '/admin/country/settings' },
] as const

const STAFF = [
  { key: 'dashboard', path: '/admin/country' },
  { key: 'agencyMenu', path: '/admin/country/agencies' },
  { key: 'crm', path: '/admin/country/crm' },
  { key: 'auditions', path: '/admin/country/auditions' },
  { key: 'stats', path: '/admin/country/stats' },
  { key: 'settings', path: '/admin/country/settings' },
] as const

export default function CountryAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { staff, locale, country, me } = useCountrySession()
  const menu = staff ? STAFF : ADMIN
  return (
    <CountryAdminAuthGate>
      <div className="flex min-h-screen flex-col bg-gray-50 md:h-screen">
        <header className="border-b bg-white px-4 py-2.5 text-sm text-gray-700">
          {country?.name ?? '국가'} {country?.code ?? ''} · {me.data?.displayName ?? me.data?.email ?? '담당자'} · {me.data?.role ?? ''}
        </header>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="shrink-0 border-b bg-white p-3 md:w-56 md:border-b-0 md:border-r md:p-4">
            <nav className="flex gap-2 overflow-x-auto md:block md:space-y-2">
              {menu.map((item) => {
                const active = item.path === '/admin/country' ? pathname === item.path : pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm ${active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {label(locale, item.key)}
                  </Link>
                )
              })}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </CountryAdminAuthGate>
  )
}
