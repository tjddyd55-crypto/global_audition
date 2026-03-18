'use client'

import { Link } from '../../i18n.config'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auditions" className="text-gray-600 hover:text-purple-600">
                  오디션
                </Link>
              </li>
              <li>
                <Link href="/channels" className="text-gray-600 hover:text-purple-600">
                  채널
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gray-600 hover:text-purple-600">
                  영상
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">For Agencies</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auditions/create" className="text-gray-600 hover:text-purple-600">
                  Post Audition
                </Link>
              </li>
              <li>
                <Link href="/my/dashboard" className="text-gray-600 hover:text-purple-600">
                  대시보드
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>© 2026 Global Audition. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
