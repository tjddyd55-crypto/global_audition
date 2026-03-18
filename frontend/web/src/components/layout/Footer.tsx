'use client'

import { Link } from '../../i18n.config'
import { useTranslations } from 'next-intl'

/* Figma Footer: 4 columns - Brand, Quick Links, For Agencies, Legal */

export default function Footer() {
  const t = useTranslations('common')

  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand - Figma */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('appName')}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              기획사와 지망생을 연결하는 온라인 오디션 플랫폼
            </p>
          </div>

          {/* Quick Links - Figma */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auditions" className="text-gray-600 hover:text-purple-600 transition-colors">
                  {t('auditions')}
                </Link>
              </li>
              <li>
                <Link href="/channels" className="text-gray-600 hover:text-purple-600 transition-colors">
                  채널 목록
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-gray-600 hover:text-purple-600 transition-colors">
                  {t('videos')}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Agencies - Figma */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">For Agencies</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auditions/create" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Post Audition
                </Link>
              </li>
              <li>
                <Link href="/my/dashboard" className="text-gray-600 hover:text-purple-600 transition-colors">
                  대시보드
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal - Figma */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          <p>© 2026 Global Audition. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
