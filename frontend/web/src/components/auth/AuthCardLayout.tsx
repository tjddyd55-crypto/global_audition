import type { ReactNode } from 'react'

interface AuthCardLayoutProps {
  title: string
  children: ReactNode
}

export default function AuthCardLayout({ title, children }: AuthCardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
        <h1 className="mb-6 text-center text-3xl font-semibold text-gray-900">{title}</h1>
        {children}
      </div>
    </div>
  )
}
