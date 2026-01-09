'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Audition Platform
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/auditions" className="hover:text-primary-600">
              오디션
            </Link>
            <Link href="/profile" className="hover:text-primary-600">
              프로필
            </Link>
            <Link href="/login" className="hover:text-primary-600">
              로그인
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
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
              onClick={() => setIsMenuOpen(false)}
            >
              오디션
            </Link>
            <Link
              href="/profile"
              className="block py-2 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              프로필
            </Link>
            <Link
              href="/login"
              className="block py-2 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              로그인
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
