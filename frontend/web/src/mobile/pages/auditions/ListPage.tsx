'use client'

import AuditionList from '@/components/audition/AuditionList'

export default function MobileAuditionsListPage() {
  return (
    <div className="min-h-screen w-full pt-8 pb-8">
      <h1
        className="mb-8 text-3xl font-bold md:text-4xl"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        오디션 목록
      </h1>
      <AuditionList />
    </div>
  )
}
