'use client'

import AuditionList from '../../../components/audition/AuditionList'

export default function AuditionsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">오디션 목록</h1>
        <AuditionList />
      </div>
    </div>
  )
}
