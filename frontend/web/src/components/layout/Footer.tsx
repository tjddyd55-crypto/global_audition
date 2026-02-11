export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Audition Platform</h3>
            <p className="text-gray-400">
              기획사와 지망생을 연결하는 온라인 오디션 플랫폼
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">링크</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="/about" className="hover:text-white">
                  소개
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-white">
                  도움말
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white">
                  문의
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">연락처</h3>
            <p className="text-gray-400">
              Email: support@audition-platform.com
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Audition Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
