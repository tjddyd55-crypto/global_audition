import { Link } from '../../i18n.config'
import { PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/lib/ui/specClasses'

export default function Footer() {
  const colTitle = `${TITLE_PAGE} mb-3`
  const linkClass = `${TEXT_SUB} block hover:text-gray-900`

  return (
    <footer className="mt-auto border-t border-[#E5E7EB] bg-white">
      <div className={`${PAGE_CONTAINER} py-12`}>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h3 className={colTitle}>Quick Links</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/auditions" className={linkClass}>
                  오디션
                </Link>
              </li>
              <li>
                <Link href="/channels" className={linkClass}>
                  채널
                </Link>
              </li>
              <li>
                <Link href="/videos" className={linkClass}>
                  영상
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={colTitle}>For Agencies</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/dashboard/auditions/create" className={linkClass}>
                  Post Audition
                </Link>
              </li>
              <li>
                <Link href="/my/dashboard" className={linkClass}>
                  대시보드
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={colTitle}>Legal</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="#" className={linkClass}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className={linkClass}>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={`mt-10 border-t border-[#E5E7EB] pt-6 text-center ${TEXT_SUB}`}>
          <p>© 2026 Global Audition. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
