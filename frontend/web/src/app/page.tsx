import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Audition Platform
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            기획사와 지망생을 연결하는 온라인 오디션 플랫폼
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auditions"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              오디션 보기
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">오디션 참가</h2>
            <p className="text-gray-600">
              다양한 오디션에 지원하고 기회를 잡아보세요
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">프로필 관리</h2>
            <p className="text-gray-600">
              나만의 프로필과 영상을 관리하고 공유하세요
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">기획사 제안</h2>
            <p className="text-gray-600">
              기획사로부터 직접 오디션 제안을 받아보세요
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
