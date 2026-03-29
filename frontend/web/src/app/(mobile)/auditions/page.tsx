'use client'

import AuditionList from '../../../components/audition/AuditionList'

export default function AuditionsPage() {
  return (
    <div className="min-h-screen w-full p-4 md:p-8">
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">오디션 목록</h1>
      <AuditionList />
    </div>
  )
}
