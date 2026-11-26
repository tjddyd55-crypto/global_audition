'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment } from 'react'
import { countryWorkspaceHref } from '@/shared/auth/adminPageAccess'
import { CountryAdminAuthGate } from '@/components/admin/CountryAdminAuthGate'
import { label, useCountrySession } from './kit'

const MENU = [
  { label: '기획사 관리', items: [
    { key: 'agencyMenu', path: '/admin/country/agencies', staff: true },
    { key: 'approvals', path: '/admin/country/approvals' },
    { key: 'crm', path: '/admin/country/crm', staff: true },
    { key: 'auditions', path: '/admin/country/auditions', staff: true },
  ] },
  { label: '조직 및 직원 관리', items: [{ key: 'staff', path: '/admin/country/staff' }] },
  { label: '실적 및 정산', items: [
    { key: 'stats', path: '/admin/country/stats', staff: true },
    { key: 'settlement', path: '/admin/country/settlement' },
  ] },
  { label: '계약 및 설정', items: [
    { key: 'myContract', path: '/admin/country/contract' },
    { key: 'settings', path: '/admin/country/settings', staff: true },
  ] },
] as const

export default function CountryAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { staff, locale, country, me, headquarters, countries, code, href } = useCountrySession()
  const activePath = (path: string) => pathname === path || pathname.startsWith(path + '/')
  return (
    <CountryAdminAuthGate>
      <div className="flex h-dvh flex-col overflow-hidden bg-gray-50">
        <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-white px-4 py-2.5 text-sm text-gray-700">
          {headquarters && <strong className="text-violet-800">본사 관리자 모드</strong>}
          <span>{country?.name ?? '국가 선택'} {code} · {me.data?.displayName ?? me.data?.email ?? '담당자'}</span>
          {headquarters && (
            <>
              <select aria-label="관리 대상 국가" className="rounded border bg-white px-2 py-1" value={code} onChange={event => router.push(countryWorkspaceHref('/admin/country', event.target.value))}>
                <option value="">국가 선택</option>
                {countries.data?.map(row => <option key={row.code} value={row.code}>{row.name} {row.code}</option>)}
              </select>
              <Link href="/admin/super/countries" className="font-medium text-violet-700 underline">본사 관리자로 돌아가기</Link>
            </>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {code && <aside className="shrink-0 overflow-y-auto border-b bg-white p-3 md:w-56 md:border-b-0 md:border-r md:p-4">
            <nav aria-label="국가 관리자 메뉴" className="flex flex-wrap items-start gap-2 md:block md:space-y-2">
              <Link href={href('/admin/country')} aria-current={pathname === '/admin/country' ? 'page' : undefined} className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100 aria-[current=page]:bg-violet-100">
                {label(locale, 'dashboard')}
              </Link>
              {MENU.map(group => {
                const items = group.items.filter(item => !staff || 'staff' in item)
                if (items.length === 0) return null
                return (
                  <details key={group.label} open={items.some(item => activePath(item.path))}>
                    <summary className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">{group.label}</summary>
                    {items.map(item => (
                      <Link key={item.path} href={href(item.path)} aria-current={activePath(item.path) ? 'page' : undefined} className="ml-3 block rounded-md px-3 py-2 text-sm hover:bg-gray-100 aria-[current=page]:bg-violet-100 aria-[current=page]:font-semibold">
                        {label(locale, item.key)}
                      </Link>
                    ))}
                  </details>
                )
              })}
            </nav>
          </aside>}
          <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
            {code ? (
              headquarters && pathname === '/admin/country/settings'
                ? <p>본사 관리자 모드의 표시 언어는 한국어입니다. 개인 계정 설정은 본인의 관리자 화면에서 변경할 수 있습니다.</p>
                : <Fragment key={code}>{children}</Fragment>
            ) : countries.isError ? <p role="alert">국가 목록을 불러오지 못했습니다. <button className="underline" onClick={() => void countries.refetch()}>다시 시도</button></p>
              : countries.isLoading ? <p>국가 목록을 불러오는 중…</p>
              : <p>{headquarters ? '관리할 국가를 선택하세요.' : '배정된 국가가 없습니다.'}</p>}
          </main>
        </div>
      </div>
    </CountryAdminAuthGate>
  )
}
